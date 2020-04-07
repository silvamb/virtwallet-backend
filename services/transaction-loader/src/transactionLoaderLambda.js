const AWS = require('aws-sdk');
const TransactionLoaderHandler = require('./transactionLoaderHandler').TransactionLoaderHandler;
const handler = new TransactionLoaderHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    const detail = event.detail;

    const result = handler.processEvent(detail);
    
    console.log(result);

    return result;
};