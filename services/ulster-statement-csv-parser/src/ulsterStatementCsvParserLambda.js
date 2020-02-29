const handler = require('./ulsterStatementCsvParserHandler');
const UlsterCsvParserHandler = handler.UlsterCsvParserHandler;
const AWS = require('aws-sdk');
const csvParserHandler = new UlsterCsvParserHandler(new AWS.S3(), new AWS.SQS());

exports.handle = async event => {
    
    const records = event.Records;

    if(!Array.isArray(records) || records.length < 1 ) {
        throw new Error('No records to process!');
    }

    const promises = records.map(processRecord);

    const results = await Promise.all(promises);
    
    results.forEach(result => console.log(result));

    return results;
};

async function processRecord(record) {
    const msgBody = JSON.parse(record.body);

    return await csvParserHandler.handle(msgBody);
}