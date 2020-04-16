const AWS = require('aws-sdk');
const TransactionLoaderHandler = require('./transactionLoaderHandler').TransactionLoaderHandler;
const handler = new TransactionLoaderHandler(new AWS.DynamoDB(), new AWS.EventBridge());

exports.handle = async event => {
    
    const detail = event.detail;

    const result = await handler.processEvent(detail);
    
    console.log(result);

    return result;
};