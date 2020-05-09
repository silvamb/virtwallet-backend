const transaction = require('libs/transaction');
const Transaction = transaction.Transaction;
const isChangeNotifiable = transaction.isChangeNotifiable;
const updateTransaction = transaction.update;
const dynamodb = require('libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const ExpressionBuilder = dynamodb.ExpressionBuilder;
const fromItem = dynamodb.fromItem;
const SK = dynamodb.SK;
const getPK = transaction.getPK;
const getSK = transaction.getSK;
const getSKAttr = transaction.getSKAttr;

class TransactionHandler {
    constructor(dbClient, eventbridge) {
        console.log("Creating Transaction Handler");
        this.dbClient = new DynamoDb(dbClient);
        this.eventbridge = eventbridge;
    }

    async handle(operation, parameters) {
        console.log(`Invoking operation TransactionHandler.${operation}`);

        if(!this[operation]) {
            throw new Error(`Invalid operation TransactionHandler.${operation}`);
        }

        return await this[operation](parameters);
    }

    async create(parameters) {
        const clientId = parameters.clientId;
        const accountId = parameters.accountId;
        const walletId = parameters.walletId;
        const transactionsToAdd = parameters.transactions;
        const overwrite = !('overwrite' in parameters) || parameters.overwrite;
        const generateId = parameters.generateId;

        // TODO validate if user is a member of this account
        // TODO validate transaction details

        console.log(`Creating transactions for user ${clientId} and wallet ${walletId}.`);
    
        const transactions = transactionsToAdd.map((transactionDetails) => {
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
            transaction.categoryId = transactionDetails.categoryId;
            transaction.keyword = transactionDetails.keyword || transactionDetails.description.trim();
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

        return retVal;
    }

    async list(parameters) {
        // TODO validate if the client has permissions to access the wallet.

        const accountId = parameters.accountId;
        const walletId = parameters.walletId;

        const pk = getPK(accountId);

        const to = parameters.to || "0000-00-00";
        const from = parameters.from || "9999-99-99";
        const fromWalletId = walletId || "0000";
        const toWalletId = walletId || "9999";
        const fromAttr = getSKAttr(fromWalletId, from);
        const toAttr = getSKAttr(toWalletId, to);
        const skExpression = new ExpressionBuilder().between(SK, fromAttr, toAttr).build();
        const queryBuilder = new QueryBuilder(pk).withSkExpression(skExpression);

        const queryData = await this.dbClient.query(queryBuilder.build());
    
        const transactions = queryData.Items.map((item) => {
            return fromItem(item, new Transaction());
        });
    
        console.log(transactions);

        return transactions;
    }

    async get(_parameters) {
        throw new Error("Operation TransactionHandler.get not implemented yet");
    }

    async update(parameters) {
        const oldAttributes = parameters.transactions.old;
        const updatedAttributes = parameters.transactions.new;
        const txDate = parameters.txDate;

        if(!oldAttributes || !updatedAttributes || !txDate) {
            throw new Error("Event body invalid for Transaction update");
        }

        console.log(`Updating transaction [${parameters.txId}] attributes from`, oldAttributes, "to", updatedAttributes);
        const transactionToUpdate = new Transaction();

        for(let attribute in oldAttributes) {
            if(transactionToUpdate.hasOwnProperty(attribute)
                && typeof(transactionToUpdate[attribute]) == typeof(oldAttributes[attribute])) {
                transactionToUpdate[attribute] = oldAttributes[attribute];
            } else {
                throw new Error(`Old attribute '${attribute}' is not a valid Transaction attribute`);
            }
        }

        // Check if some update attribute doesn't have the old value
        for(let updatedAttribute in updatedAttributes) {
            if(!oldAttributes.hasOwnProperty(updatedAttribute)) {
                throw new Error(`Missing old value for attribute '${updatedAttribute}'`);
            }
        }

        transactionToUpdate.accountId = parameters.accountId;
        transactionToUpdate.walletId = parameters.walletId;
        transactionToUpdate.txDate = txDate;
        transactionToUpdate.txId = parameters.txId;

        const updateResult = await updateTransaction(this.dbClient, transactionToUpdate, updatedAttributes);

        if(updateResult.success && isChangeNotifiable(updatedAttributes)) {
            await publishUpdatedTransaction(this.eventbridge, parameters, updateResult.data.Attributes);
        }

        return updateResult;
    }

    async delete(_parameters) {
        throw new Error("Operation TransactioHandler.delete not implemented yet");
    }

    async deleteAll(parameters) {
        // TODO validate if the client has permissions to access the wallet.

        const accountId = parameters.accountId;
        const walletId = parameters.walletId;

        const pk = getPK(accountId);
        const sk = getSK(walletId);
        const query = new QueryBuilder(pk).withSkStartingWith(sk).returnKeys().build();

        const queryData = await this.dbClient.query(query);

        console.log(`Returned ${queryData.Items.length} items to delete`);

        const deleteAllResult = await this.dbClient.deleteAll(queryData.Items);

        return deleteAllResult;
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

async function publishUpdatedTransaction(eventbridge, parameters, oldAttributes) {
    const oldTransaction = fromItem(oldAttributes, new Transaction());
    const old = {
        value: oldTransaction.value,
        categoryId: oldTransaction.categoryId,
    };

    const transactionChanges = {
        accountId: parameters.accountId,
        walletId: parameters.walletId,
        txDate: parameters.txDate,
        txId: parameters.txId,
        old: Object.assign(old, parameters.transactions.old),
        new: parameters.transactions.new,
    };

    const params = {
        Entries: [
            {
                Source: "virtwallet",
                DetailType: "transaction updated", // TODO add Event types in a file in libs
                Time: new Date(),
                Detail: JSON.stringify(transactionChanges),
            },
        ],
    };

    console.log("Publishing [transaction updated] event", params);

    const putEventResult = await eventbridge.putEvents(params).promise();
    console.log("Publishing [transaction updated] event result", putEventResult);
}

exports.TransactionHandler = TransactionHandler;