const transaction = require('libs/transaction');
const Transaction = transaction.Transaction;
const TransactionFilter = transaction.TransactionFilter;
const isChangeNotifiable = transaction.isChangeNotifiable;
const createTransactions = transaction.create;
const listTransactions = transaction.list;
const updateTransaction = transaction.update;
const dynamodb = require('libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;
const getPK = transaction.getPK;
const getSK = transaction.getSK;
const getSKAttr = transaction.getSKAttr;

class TransactionHandler {
    constructor(dynamodb, eventbridge) {
        console.log("Creating Transaction Handler");
        this.dynamodb = dynamodb;
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

        return await createTransactions(this.dynamodb, clientId, accountId, walletId, transactionsToAdd, overwrite, generateId);
    }

    async list(parameters) {
        const accountId = parameters.accountId;
        const walletId = parameters.walletId;
        const from = parameters.from;
        const to = parameters.to;
        const order = parameters.order;

        const transactionFilter = new TransactionFilter().between(from, to);

        return await listTransactions(this.dynamodb, accountId, walletId, transactionFilter, order)
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

        const updateResult = await updateTransaction(this.dynamodb, transactionToUpdate, updatedAttributes);

        console.log("Transaction updated, result:", updateResult);

        if(updateResult.success && isChangeNotifiable(updatedAttributes)) {
            await publishUpdatedTransaction(this.eventbridge, parameters, updateResult.data.Attributes);
        }

        return updateResult;
    }

    async delete(_parameters) {
        throw new Error("Operation TransactioHandler.delete not implemented yet");
    }

    async deleteAll(parameters) {
        const accountId = parameters.accountId;
        const walletId = parameters.walletId;

        const pk = getPK(accountId);
        const sk = getSK(walletId);
        const query = new QueryBuilder(pk).sk.beginsWith(sk).returnKeys().build();
        const dbClient = new DynamoDb(this.dynamodb);
        const queryData = await dbClient.query(query);

        console.log(`Returned ${queryData.Items.length} items to delete`);

        const deleteAllResult = await dbClient.deleteAll(queryData.Items);

        return deleteAllResult;
    }
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
                DetailType: "transaction updated",
                Time: new Date(),
                Detail: JSON.stringify(transactionChanges),
            },
        ],
    };

    console.log("Publishing [transaction updated] event", params);

    const putEventResult = await eventbridge.putEvents(params).promise();
    console.log("Publishing [transaction updated] event result", putEventResult);
}

function order(first, second) {
    const firstTx = first.dt + first.description;
    const secondTx = second.dt + second.description;

    return firstTx.localeCompare(secondTx);
}

exports.TransactionHandler = TransactionHandler;