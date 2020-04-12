const categoryRules = require("libs/categoryRule");

class TransactionClassifierHandler {
    constructor(dynamodb, eventbridge) {
        this.dynamodb = dynamodb;
        this.eventbridge = eventbridge;
    }

    async classifyAndPublishTransactions(detail) {
        console.log(`Start classifying transactions from file [${detail.fileName}]`);

        // TODO validate if user is a member of this account
        // TODO validate transaction details

        console.log(`Classifying transactions for account ${detail.account} and wallet ${detail.wallet}.`);

        const categoryRulesList = await categoryRules.list(this.dynamodb, detail.account);
        
        detail.transactions.forEach(transaction => classify(categoryRulesList, transaction));

        console.log(`Finished classifying transactions from file [${detail.fileName}]`);


        const publishResult = await publishEvent(this.eventbridge, detail);

        console.log("Published Event Result", publishResult);
    }
}

function classify(categoryRulesList, transaction) {
    let category = "NO_CATEGORY";
    const keywordRule = categoryRulesList.findKeyword(transaction.keyword);

    if(keywordRule) {
        category = keywordRule.categoryId;
    } else {
        const expressionRule = categoryRulesList.findFirst(transaction.description.trim());
        if(expressionRule){
            category = expressionRule.categoryId;
        }
    }

    console.log(`Setting category [${category}] for transaction [${transaction.txId}]`);
    transaction.categoryId = category;
}

function publishEvent(eventbridge, details) {
    const params = {
        Entries: [
            {
                Source: "virtwallet",
                DetailType: "transactions classified", // TODO add Event types in a file in libs
                Time: new Date(),
                Detail: JSON.stringify(details),
            },
        ],
    };

    console.log("Publishing [transactions classifed] event");

    return eventbridge.putEvents(params).promise();
}

exports.TransactionClassifierHandler = TransactionClassifierHandler;
