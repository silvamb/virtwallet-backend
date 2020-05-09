const metrics = require('libs/metrics');
const Metrics = metrics.Metrics;

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
    ["transaction updated", processTransactionUpdated]
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
    const yearKey = transaction.txDate.substring(0,4);
    const monthKey = transaction.txDate.substring(0,7);
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


async function processTransactionUpdated(dbClient, details) {
    console.log("Calculating metrics to update after transaction update");
    const metricsToUpdate = [];

    const yearKey = details.txDate.substring(0,4);
    const monthKey = details.txDate.substring(0,7);
    const dayKey = details.txDate;

    addMetricsFromUpdatedTx(details, yearKey, metricsToUpdate);
    addMetricsFromUpdatedTx(details, monthKey, metricsToUpdate);
    addMetricsFromUpdatedTx(details, dayKey, metricsToUpdate);

    await metrics.update(dbClient, metricsToUpdate);

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