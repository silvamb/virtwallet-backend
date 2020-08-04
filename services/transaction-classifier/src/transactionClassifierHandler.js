const categoryRules = require("libs/categoryRule");
const transactionLib = require("libs/transaction");
const dynamodb = require("libs/dynamodb");
const DynamoDb = dynamodb.DynamoDb;

class TransactionClassifierHandler {
    constructor(dynamodb, eventbridge) {
        this.dynamodb = dynamodb;
        this.eventbridge = eventbridge;
    }

    async classifyAndPublishTransactions(detail) {
        console.log(`Start classifying transactions from file [${detail.fileName}]`);

        console.log(`Classifying transactions for account ${detail.account} and wallet ${detail.wallet}.`);

        const categoryRulesList = await categoryRules.list(this.dynamodb, detail.account);
        
        detail.transactions.forEach(transaction => classify(categoryRulesList, transaction));

        console.log(`Finished classifying transactions from file [${detail.fileName}]`);


        const publishResult = await publishEvent(this.eventbridge, detail);

        console.log("Published Event Result", publishResult);
    }

    async reclassifyTransactions(event) {
        const accountId = event.pathParameters.accountId;
        const dbClient = new DynamoDb(this.dynamodb);
        
        const transactions = await loadTransactions(dbClient, event);
        if(transactions.length == 0) {
            return [];
        }

        const categoryRulesList = await categoryRules.list(this.dynamodb, accountId);
        const changedTransactions = [];
        transactions.forEach(transaction => {
            const oldCategory = transaction.categoryId;
            const newCategory = getCategory(categoryRulesList, transaction);
            if(oldCategory != newCategory) {
                console.log(`Transaction ${transaction.txId} changed category from [${oldCategory}] to [${newCategory}]`);
                changedTransactions.push(new transactionLib.TransactionChangeSet(transaction, {categoryId: newCategory}));
            }
        });

        if(changedTransactions.length > 0) {
            return await updateTransactions(dbClient, this.eventbridge, event, changedTransactions);
        }

        console.log("No transactions have been updated");
        return [];
    }
}

async function loadTransactions(dbClient, event) {
    const accountId = event.pathParameters.accountId;
    const walletId = event.pathParameters.walletId;
    const from = event.queryStringParameters.from;
    const to = event.queryStringParameters.to;
    const filters = event.queryStringParameters.filters;

    const transactionFilter = new transactionLib.TransactionFilter().between(from, to);

    if(filters == "manual") {
        transactionFilter.onlyManuallyInserted();
    } else if(filters == "auto"){
        transactionFilter.onlyAutomaticallyInserted();
    }

    console.log("Loading transactions for params:", accountId, walletId, from, to);
    const transactions = await transactionLib.list(dbClient, accountId, walletId, transactionFilter);

    console.log("Total transactions loaded:", transactions.length);
    
    return transactions;
}

function getCategory(categoryRulesList, transaction) {
    let categoryId = "NO_CATEGORY";
    const keywordRule = categoryRulesList.findKeyword(transaction.keyword);

    if(keywordRule) {
        categoryId = keywordRule.categoryId;
    } else {
        const expressionRule = categoryRulesList.findFirst(transaction.description.trim());
        if(expressionRule){
            categoryId = expressionRule.categoryId;
        }
    }

    return categoryId;
}

async function updateTransactions(dbClient, eventbridge, event, changedTransactions) {
    const accountId = event.pathParameters.accountId;
    const walletId = event.pathParameters.walletId;

    console.log("Updating transactions");
    const updateAllResult = await transactionLib.updateAll(dbClient, changedTransactions);

    console.log("Update transactions result:", updateAllResult);

    const updatedTransactions = changedTransactions.filter(result => result.success);
    if(updatedTransactions.length > 0) {
        await publishUpdatedTransactions(eventbridge, accountId, walletId, updatedTransactions);
    }

    return updateAllResult.map((result, i) => {
        const transaction = changedTransactions[i].transaction;
        return {
            txId: transaction.txId,
            txDate: transaction.txDate,
            oldCategoryId: transaction.categoryId,
            newCategoryId: changedTransactions[i].updatedAttributes.categoryId,
            error: result.success ? null : result.data.message
        }
    });
}

function classify(categoryRulesList, transaction) {
    const categoryId = getCategory(categoryRulesList, transaction);

    console.log(`Setting category [${categoryId}] for transaction [${transaction.txId}]`);
    transaction.categoryId = categoryId;
}

function publishEvent(eventbridge, details) {
    const params = {
        Entries: [
            {
                Source: "virtwallet",
                DetailType: "transactions classified",
                Time: new Date(),
                Detail: JSON.stringify(details),
            },
        ],
    };

    console.log("Publishing [transactions classifed] event");

    return eventbridge.putEvents(params).promise();
}

async function publishUpdatedTransactions(eventbridge, accountId, walletId, changedTransactions) {
    const changes = changedTransactions.map(transactionChange => {
        return {
            txDate: transactionChange.transaction.txDate,
            txId: transactionChange.transaction.txId,
            old: {
                categoryId: transactionChange.transaction.categoryId,
                value: transactionChange.transaction.value
            },
            new: {
                categoryId: transactionChange.updatedAttributes.categoryId
            }
        };
    });

    const transactionChanges = {
        accountId: accountId,
        walletId: walletId,
        changes: changes
    };

    const params = {
        Entries: [
            {
                Source: "virtwallet",
                DetailType: "transactions updated",
                Time: new Date(),
                Detail: JSON.stringify(transactionChanges),
            },
        ],
    };

    console.log("Publishing [transactions updated] event", params);

    const putEventResult = await eventbridge.putEvents(params).promise();
    console.log("Publishing [transactions updated] event result", putEventResult);
}

exports.TransactionClassifierHandler = TransactionClassifierHandler;
