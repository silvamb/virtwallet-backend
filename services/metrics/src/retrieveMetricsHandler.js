const metrics = require('libs/metrics');

exports.retrieveMetrics =  async (dynamodb, event) => {
    
    if(!event.pathParameters || !event.pathParameters.accountId) {
        throw new Error("Missing account ID");
    }
    const accountId = event.pathParameters.accountId;
    const { walletId, date, categoryId } = event.queryStringParameters || {};

    return metrics.retrieve(dynamodb, accountId, walletId, date, categoryId);
}