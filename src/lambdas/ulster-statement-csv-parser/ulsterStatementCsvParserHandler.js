
const UlsterCsvParser = require('./ulsterStatementCsvParser').UlsterCsvParser;

class UlsterCsvParserHandler {
    constructor(s3, sqsClient) {
        this.s3 = s3;
        this.sqsClient = sqsClient;
        this.parser = new UlsterCsvParser(s3);
    }

    async handle(fileInfo) {
        const transactions = await this.parser.parseCsvFile(fileInfo.bucketName, fileInfo.objectKey);

        const enqueueResult = await enqueueTransactions(this.sqsClient, transactions, fileInfo);

        console.log("Enqueue result ", enqueueResult);

        return enqueueResult;
    }

}

async function enqueueTransactions(sqsClient, transactions, fileInfo) {
    const queueUrl = process.env.transaction_queue_url;
    
    if(!queueUrl) {
        throw new Error("Transactions queue URL not defined");
    }

    const message = Object.assign({}, fileInfo);

    message.transactions = transactions;

    var params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl
    };

    console.log("Enqueueing transactions");
    return sqsClient.sendMessage(params).promise();
}

exports.UlsterCsvParserHandler = UlsterCsvParserHandler;