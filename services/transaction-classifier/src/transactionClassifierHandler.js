const categoryRules = require("libs/categoryRule");
const transactionLib = require("libs/transaction");
const { createVersionForUpdatedItems, publishChangeSet } = require('libs/version');

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
        
        const transactions = await loadTransactions(this.dynamodb, event);
        if(transactions.length == 0) {
            return [];
        }

        const categoryRulesList = await categoryRules.list(this.dynamodb, accountId);
        const changedTransactions = [];
        transactions.forEach(transaction => {
            const oldCategory = transaction.categoryId;
            const newCategory = getCategory(categoryRulesList, transaction);
            if(oldCategory != newCategory && newCategory !== 'NO_CATEGORY') {
                console.log(`Transaction ${transaction.txId} changed category from [${oldCategory}] to [${newCategory}]`);
                changedTransactions.push(new transactionLib.TransactionChangeSet(transaction, {categoryId: newCategory}));
            }
        });

        if(changedTransactions.length > 0) {
            const updateResult = await updateTransactions(this.dynamodb, this.eventbridge, event, changedTransactions);

            const versionedChangeSet = await createVersionForUpdatedItems({dynamodb: this.dynamodb, accountId, results: updateResult});

            if(versionedChangeSet) {
                await publishChangeSet(this.eventbridge, versionedChangeSet);
            }
    
            return updateResult;
        }

        console.log("No transactions have been updated");
        return [];
    }
}

async function loadTransactions(dynamodb, event) {
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
    const transactions = await transactionLib.list(dynamodb, accountId, walletId, transactionFilter);

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

async function updateTransactions(dynamodb, eventbridge, event, changedTransactions) {
    const accountId = event.pathParameters.accountId;
    const walletId = event.pathParameters.walletId;

    console.log("Updating transactions");
    const updateAllResult = await transactionLib.updateAll(dynamodb, changedTransactions);

    console.log("Update transactions result:", updateAllResult);

    const updatedTransactions = changedTransactions.filter((_changeSet, index) => updateAllResult[index].data);
    if(updatedTransactions.length > 0) {
        await publishUpdatedTransactions(eventbridge, accountId, walletId, updatedTransactions);
    }

    return updateAllResult;
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
