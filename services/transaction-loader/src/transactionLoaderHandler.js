
const { Transaction, create } = require('libs/transaction');
const { retrieve } = require('libs/account');
const DynamoDb = require('libs/dynamodb').DynamoDb;

function parseEvent(detail) {
    console.log("Parsing event detail", detail);

    return {
        clientId: detail.clientId || "NOT_DEFINED",
        accountId: detail.account,
        walletId: detail.wallet,
        transactions: {
            source: detail.fileName,
            sourceType: "A",
            transactions: detail.transactions,
        },
        overwrite: false
    };
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
                referenceMonth: transactions[i].referenceMonth,
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
                    DetailType: "transactions created",
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

exports.processEvent = async (dynamodb, eventbridge, detail) => {
    console.log(`Start processing transactions from file [${detail.fileName}]`);
    
    const parameters = parseEvent(detail);

    const clientId = parameters.clientId;
    const accountId = parameters.accountId;
    const walletId = parameters.walletId;
    const transactionsToAdd = parameters.transactions;
    const overwrite = !('overwrite' in parameters) || parameters.overwrite;
    const generateId = parameters.generateId;

    console.log("Loading details for account", accountId);
    const account = await retrieve(dynamodb, clientId, accountId);
    const monthStartDateRule = account.monthStartDateRule;
    console.log("Month Start Date rule", monthStartDateRule)

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
        transaction.referenceMonth = monthStartDateRule.getMonth(transactionDetails.txDate);

        return transaction;
    });

    const dbClient = new DynamoDb(dynamodb);
    const result = await create(dbClient, clientId, accountId, walletId, transactions, overwrite, generateId);

    const transformedResults = Array.isArray(result) ? result.map(transformPutItemsResult) : [transformPutItemsResult(result)];

    console.log(`Finished processing transaction from file [${detail.fileName}]`);

    await publishEvent(eventbridge, transformedResults, transactions);

    return transformedResults;
}