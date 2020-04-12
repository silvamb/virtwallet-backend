const AWS = require('aws-sdk');
const TransactionClassifierHandler = require('./transactionClassifierHandler').TransactionClassifierHandler;
const handler = new TransactionClassifierHandler(new AWS.DynamoDB(), new AWS.EventBridge());

exports.handle = async event => {

    console.log("Processing event:", event);

    const detail = event.detail;

    await handler.classifyAndPublishTransactions(detail);

    console.log("Finished processing event");
};