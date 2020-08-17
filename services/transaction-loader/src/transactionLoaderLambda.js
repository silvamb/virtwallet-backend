const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const eventbridge = new AWS.EventBridge();
const { processEvent } = require('./transactionLoaderHandler');

exports.handle = async event => {
    
    const detail = event.detail;

    const result = await processEvent(dynamodb, eventbridge, detail);
    
    console.log(result);

    return result;
};