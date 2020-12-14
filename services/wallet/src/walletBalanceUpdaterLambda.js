const AWS = require('aws-sdk');
const { updateBalance } = require('./walletBalanceUpdater');
const dynamodb = new AWS.DynamoDB();
const eventBridge = new AWS.EventBridge();

exports.handle = async event => {
    console.log("Event:", event)

    await updateBalance(dynamodb, eventBridge, event);
};