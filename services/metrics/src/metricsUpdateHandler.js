const metrics = require('libs/metrics');
const Metrics = metrics.Metrics;

exports.updateMetrics = async (dynamodb, details) => {
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