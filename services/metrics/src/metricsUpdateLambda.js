const AWS = require('aws-sdk');
const updateMetrics = require('./metricsUpdateHandler').updateMetrics
const dynamodb = new AWS.DynamoDB();

exports.handle = async event => {
    console.log("Event: ", event)

    await updateMetrics(dynamodb, event.detail);
};