const AWS = require('aws-sdk');
const { saveChangeSet } = require('./accountChangeSetHandler');
const dynamodb = new AWS.DynamoDB();

exports.handle = async event => {

    console.log("Processing event:", event);

    await saveChangeSet(dynamodb, event)

    console.log("Finished processing event");
};