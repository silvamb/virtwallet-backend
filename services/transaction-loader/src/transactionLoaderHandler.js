
const Transaction = require('libs/transaction').Transaction;
const DynamoDb = require('libs/dynamodb').DynamoDb;

function parseEvent(detail) {
    console.log("Parsing event detail", detail);

    return {
        clientId: "NOT_DEFINED", // TODO Load from DynamoDB
        accountId: detail.account,
        walletId: detail.wallet,
        transactions: {
            source: detail.fileName,
            sourceType: "A", // TODO use transaction API constants
            transactions: detail.transactions,
        },
        overwrite: false
    };
}

class TransactionLoaderHandler {

    constructor(dynamodb, eventbridge) {
        this.dbClient = new DynamoDb(dynamodb);
        this.eventbridge = eventbridge;
    }

    async processEvent(detail) {
        console.log(`Start processing transactions from file [${detail.fileName}]`);
    
        const parameters = parseEvent(detail);

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
            transaction.type = transactionDetails.type;
            transaction.balance = transactionDetails.balance;
            transaction.balanceType = transactionDetails.balanceType;
            transaction.includedBy = clientId;
            transaction.categoryId = transactionDetails.categoryId;
            transaction.keyword = transactionDetails.keyword;
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
            retVal = await this.dbClient.putItem(transactions[0], overwrite);
            retVal = [transformPutItemsResult(retVal)];
        } else {
            retVal = await this.dbClient.putItems(transactions, overwrite);
            retVal = retVal.map(transformPutItemsResult);
        }
        
        

        console.log(`Finished processing transaction from file [${detail.fileName}]`);

        await publishEvent(this.eventbridge, retVal, transactions);

        return retVal;
    }

}

function transformPutItemsResult(result) {
    const transformedResult = {
        success: result.success
    };

    if(!result.success) {
        transformedResult.code = result.data.code;
        transformedResult.message = result.data.message;
    }

    return transformedResult;
}

async function publishEvent(eventbridge, results, transactions) {
    const eventDetail = {
        transactions: []
    };

    for(let i = 0; i < results.length; i++) {
        if(results[i].success) {
            eventDetail.transactions.push({
                accountId: transactions[i].accountId,
                walletId: transactions[i].walletId,
                txDate: transactions[i].txDate,
                value: transactions[i].value,
                categoryId: transactions[i].categoryId
            });
        }
    }

    if(eventDetail.transactions.length > 0) {
        const params = {
            Entries: [
                {
                    Source: "virtwallet",
                    DetailType: "transactions created", // TODO add Event types in a file in libs
                    Time: new Date(),
                    Detail: JSON.stringify(eventDetail),
                },
            ],
        };
    
        console.log("Publishing [transactions created] event", params);
    
        const putEventResult = await eventbridge.putEvents(params).promise();
        console.log("Publishing [transactions created] event result", putEventResult);
    }
}

exports.TransactionLoaderHandler = TransactionLoaderHandler;