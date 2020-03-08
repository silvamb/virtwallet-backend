
const Transaction = require('libs/transaction').Transaction;

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

class TransactionLoaderHandler {

    constructor(dbClient) {
        this.dbClient = dbClient; 
    }

    async processRecord(record) {
        console.log(`Start processing message [${record.messageId}]`);
        const msgBody = JSON.parse(record.body);
    
        const parameters = parseRecord(msgBody);


        const clientId = parameters.clientId;
        const accountId = parameters.accountId;
        const walletId = parameters.walletId;
        const transactionsToAdd = parameters.transactions;
        const overwrite = !('overwrite' in parameters) || parameters.overwrite;
        const generateId = parameters.generateId;
    
        // TODO validate if user is a member of this account
        // TODO validate transaction details
    
        console.log(`Creating transactions for user ${clientId} and wallet ${walletId}.`);
    
        const transactions = transactionsToAdd.transactions.map((transactionDetails) => {
            const transaction = new Transaction();
            transaction.txId = transactionDetails.txId;
            transaction.txDate = transactionDetails.txDate;
            transaction.accountId = accountId;
            transaction.walletId = walletId;
            transaction.dt = transactionDetails.dt;
            transaction.value = transactionDetails.value;
            transaction.description = transactionDetails.description;
            transaction.balance = transactionDetails.balance;
            transaction.balanceType = transactionDetails.balanceType;
            transaction.includedBy = clientId;
            transaction.category = transactionDetails.category;
            transaction.source = transactionsToAdd.source;
            transaction.sourceType = transactionsToAdd.sourceType;
    
            // Generate the Tx ID if it is not specified.
            if(!transaction.txId && generateId) {
                transaction.txId = String(new Date().getTime());
            }
    
            return transaction;
        });
    
        let retVal;
    
        if(transactions.length == 1) {
            console.log(`Persisting single transaction in DynamoDb: [${JSON.stringify(transactions[0])}]`);
            const item = await this.dbClient.putItem(transactions[0], overwrite);
    
            console.log("Put item returned", item);
    
            retVal = item;
        } else {
            retVal = await this.dbClient.putItems(transactions, overwrite);
            retVal = retVal.map(transformPutItemsResult);
        }
    
        console.log(`Finished processing message [${record.messageId}]`);

        return retVal;
    }

}

exports.TransactionLoaderHandler = TransactionLoaderHandler;