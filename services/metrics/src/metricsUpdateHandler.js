const metrics = require('libs/metrics');
const Metrics = metrics.Metrics;
const { list } = require('libs/transaction')

exports.updateMetrics = async (dynamodb, event) => {
    const eventType = event['detail-type'];

    if(!operationMap.has(eventType)) {
        throw new Error(`Unsupported event type: [${eventType}`);
    }

    const handler = operationMap.get(eventType);
    await handler(dynamodb, event.detail);
}

const operationMap = new Map([
    ["transactions created", processTransactionsCreated],
    ["transaction updated", processTransactionUpdated],
    ["transactions updated", processTransactionsUpdated]
]);

async function processTransactionsCreated(dynamodb, details) {
    console.log("Calculating metrics to update");

    const transactions = details.transactions;

    const metricsToUpdateMap = transactions.reduce(reducer, new Map());

    const metricsToUpdate = Array.from(metricsToUpdateMap.values());

    console.log("Metrics calculated: ", metricsToUpdate.length);

    await metrics.update(dynamodb, metricsToUpdate);

    console.log("Metrics updated");
}

function reducer(metricsMap, transaction) {
    const yearKey = transaction.referenceMonth.substring(0,4);
    const monthKey = transaction.referenceMonth;
    const dayKey = transaction.txDate;

    increment(metricsMap, yearKey, transaction);
    increment(metricsMap, monthKey, transaction);
    increment(metricsMap, dayKey, transaction);

    return metricsMap;
}

function increment(metricsMap, datePart, transaction) {
    const key = `${datePart}#${transaction.categoryId}`;

    if(!metricsMap.has(key)){
        metricsMap.set(key, new Metrics(transaction.accountId, transaction.walletId, datePart, transaction.categoryId))
    }

    metricsMap.get(key).add(transaction.value);
}


async function processTransactionUpdated(dynamodb, details) {
    console.log("Calculating metrics to update after transaction update");
    const metricsToUpdate = [];

    const yearKey = details.referenceMonth.substring(0,4);
    const monthKey = details.referenceMonth;
    const dayKey = details.txDate;

    addMetricsFromUpdatedTx(details, yearKey, metricsToUpdate);
    addMetricsFromUpdatedTx(details, monthKey, metricsToUpdate);
    addMetricsFromUpdatedTx(details, dayKey, metricsToUpdate);

    await metrics.update(dynamodb, metricsToUpdate);

    console.log("Metrics updated");
}

function addMetricsFromUpdatedTx(details, datePart, metricsToUpdate) {
    const oldCategoryId = details.old.categoryId;
    const newCategoryId = details.new.categoryId;
    const oldValue = details.old.value;
    const newValue = details.new.value || oldValue;

    const oldCategoryMetrics = new Metrics(details.accountId, details.walletId, datePart, oldCategoryId);
    if(!newCategoryId || oldCategoryId == newCategoryId) {
        oldCategoryMetrics.sum = newValue - oldValue;
        metricsToUpdate.push(oldCategoryMetrics);
    } else {
        oldCategoryMetrics.add(-oldValue);
        metricsToUpdate.push(oldCategoryMetrics);

        const newCategoryMetrics = new Metrics(details.accountId, details.walletId, datePart, newCategoryId);
        newCategoryMetrics.add(newValue);
        metricsToUpdate.push(newCategoryMetrics);
    }
}

async function processTransactionsUpdated(dbClient, details) {
    console.log("Calculating metrics to update after transactions update");
    let metricsToUpdate = [];

    details.changes.forEach(change => {
        const yearKey = change.referenceMonth.substring(0,4);
        const monthKey = change.referenceMonth;
        const dayKey = change.txDate;
        const updatedDetails = Object.assign({accountId: details.accountId, walletId: details.walletId}, change);

        addMetricsFromUpdatedTx(updatedDetails, yearKey, metricsToUpdate);
        addMetricsFromUpdatedTx(updatedDetails, monthKey, metricsToUpdate);
        addMetricsFromUpdatedTx(updatedDetails, dayKey, metricsToUpdate);
    });
    
    console.log("Aggregating similar categories (if any)");
    const aggregatedMetrics = metricsToUpdate.reduce(updatedTransactionsReducer, new Map());

    await metrics.update(dbClient, Array.from(aggregatedMetrics.values()));

    console.log("Metrics updated");
}

function updatedTransactionsReducer(metricsMap, metric) {
    const key = metric.getRange();

    if(metricsMap.has(key)) {
        metricsMap.get(key).add(metric.sum);
    } else {
        metricsMap.set(key, metric);
    }

    return metricsMap;
}

exports.recalculateMetrics =  async (dynamodb, event) => {
    if(!event.pathParameters || !event.pathParameters.accountId) {
        throw new Error("Missing account ID");
    }

    if(!event.pathParameters.walletId) {
        throw new Error("Missing wallet ID");
    }

    const accountId = event.pathParameters.accountId;
    const walletId = event.pathParameters.walletId;

    await metrics.deleteAll(dynamodb, accountId, walletId);

    console.log("Retrieving transactions for account", accountId, "and wallet", walletId);
    const transactions = await list(dynamodb, accountId, walletId);

    console.log("Recalculating metrics");

    const metricsToUpdateMap = transactions.reduce(reducer, new Map());

    const metricsToUpdate = Array.from(metricsToUpdateMap.values());

    console.log("Metrics calculated: ", metricsToUpdate);

    const metricsUpsertResult = await metrics.upsert(dynamodb, metricsToUpdate);

    console.log("Metric updated", metricsUpsertResult);

    return metricsUpsertResult;
}