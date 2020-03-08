const AWS = require('aws-sdk');
const TransactionLoaderHandler = require('./transactionLoaderHandler').TransactionLoaderHandler;
const handler = new TransactionLoaderHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    const records = event.Records;

    if(!Array.isArray(records) || records.length < 1 ) {
        throw new Error('No records to process!');
    }

    const promises = records.map(record => handler.processRecord(record));

    const results = await Promise.all(promises);
    
    results.forEach(result => console.log(result));

    return results;
};