
const UlsterCsvParser = require('./ulsterStatementCsvParser').UlsterCsvParser;

class UlsterCsvParserHandler {
    constructor(s3, eventbridge) {
        this.s3 = s3;
        this.eventbridge = eventbridge;
        this.parser = new UlsterCsvParser(s3);
    }

    async handle(fileInfo) {
        const [clientId, transactions] = await this.parser.parseCsvFile(fileInfo.bucketName, fileInfo.objectKey);
        fileInfo.clientId = clientId;
        const result = await publishEvent(this.eventbridge, transactions, fileInfo);

        console.log("Publish event result ", result);

        return result;
    }

}

async function publishEvent(eventbridge, transactions, fileInfo) {
    const details = Object.assign({}, fileInfo);

    details.transactions = transactions;

    const params = {
        Entries: [{
            Source: 'virtwallet',
            DetailType: 'transactions parsed', 
            Time: new Date(),
            Detail: JSON.stringify(details)
        }]
    };

    return eventbridge.putEvents(params).promise();
}

exports.UlsterCsvParserHandler = UlsterCsvParserHandler;