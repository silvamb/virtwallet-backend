const AWS = require('aws-sdk');
const updateMetrics = require('./metricsUpdateHandler').updateMetrics
const dynamodb = new AWS.DynamoDB();
const eventBridge = new AWS.EventBridge();

exports.handle = async event => {
    console.log("Event:", event)

    await updateMetrics(event, dynamodb, eventBridge);
};