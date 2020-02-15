const AWS = require('aws-sdk');
const TransactionHandler = require('./transactionHandler').TransactionHandler;
const transactionHandler = new TransactionHandler(new AWS.DynamoDB());

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
    console.log(`Start processing message [${record.messageId}]`);
    const msgBody = JSON.parse(record.body);

    const parameters = parseRecord(msgBody);

    const result = await transactionHandler.handle("create", parameters);

    console.log(`Finished processing message [${record.messageId}]`);
    return result;
}

function parseRecord(record) {
    console.log("Parsing record", record);

    return {
        clientId: "NOT_DEFINED", // TODO Load from DynamoDB
        accountId: record.account,
        walletId: record.wallet,
        transactions: {
            source: record.fileName,
            sourceType: "A", // TODO use transaction API constants
            transactions: record.transactions,
        },
        overwrite: false
    };
}