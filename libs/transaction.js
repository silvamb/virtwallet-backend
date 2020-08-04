const dynamoDbLib = require("./dynamodb");

const DEBIT_BALANCE_TYPE = 'Debit';
const CREDIT_BALANCE_TYPE = 'Credit';
const AUTO_INPUT = 'A';
const MANUAL_INPUT = 'M';

const attrTypeMap = new Map([
    ["accountId", dynamoDbLib.StringAttributeType],
    ["walletId", dynamoDbLib.StringAttributeType],
    ["txDate", dynamoDbLib.StringAttributeType],
    ["txId", dynamoDbLib.StringAttributeType],
    ["dt", dynamoDbLib.StringAttributeType],
    ["value", dynamoDbLib.NumberAttributeType],
    ["description", dynamoDbLib.StringAttributeType],
    ["type", dynamoDbLib.StringAttributeType],
    ["balance", dynamoDbLib.NumberAttributeType],
    ["balanceType", dynamoDbLib.StringAttributeType],
    ["includedBy", dynamoDbLib.StringAttributeType],
    ["version", dynamoDbLib.NumberAttributeType],
    ["categoryId", dynamoDbLib.StringAttributeType],
    ["keyword", dynamoDbLib.StringAttributeType],
    ["source", dynamoDbLib.StringAttributeType],
    ["sourceType", dynamoDbLib.StringAttributeType],
]);

const attrsToCompare = new Set([
    "value",
    "description",
    "type",
    "balance",
    "balanceType",
    "category"
]);

const updatableAttrs = new Set([
    "value",
    "description",
    "type",
    "balance",
    "categoryId",
    "keyword"
]);

const notifiableAttrs = new Set([
    "value",
    "categoryId"
]);

const getPK = (accountId) => `ACCOUNT#${accountId}`;


const getSK = (walletId, txDate, txId) => {
    let sk = `TX#`;
    
    const skParts = [walletId, txDate, txId].filter(v => v !== undefined).join('#');
    
    if(skParts) {
        sk = sk.concat(skParts);
    }

    return sk;
}

class TransactionChangeSet {
    constructor(transaction, updatedAttributes) {
        this.transaction = transaction;
        this.updatedAttributes = updatedAttributes;
    }
}

class Transaction {

    constructor() {
        // Key Attributes
        this.accountId = "";
        this.walletId = "";
        this.txDate = "";
        this.txId = "";

        // Attributes
        this.dt = "";
        this.value = 0.00;
        this.description = "New transaction";
        this.type = "";
        this.balance = 0.00;
        this.balanceType = DEBIT_BALANCE_TYPE;
        this.includedBy = "";
        this.version = 1;
        this.categoryId = "";
        this.keyword = "";
        this.source = "MANUAL";
        this.sourceType = MANUAL_INPUT;
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.walletId, this.txDate, this.txId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }
}

class TransactionFilter {
    
    constructor() {
        this.expressionBuilder = new dynamoDbLib.ExpressionBuilder();
        this.from = "9999-99-99";
        this.to = "0000-00-00";
    }

    get expression() {
        return this.expressionBuilder.build();
    }

    between(from = "9999-99-99", to = "0000-00-00") {
        this.from = from;
        this.to = to;

        return this;
    }

    onlyAutomaticallyInserted() {
        const itemValue = attrTypeMap.get("sourceType").toAttribute(AUTO_INPUT);
        this.expressionBuilder.equals("sourceType", itemValue);

        return this;
    }

    onlyManuallyInserted() {
        const itemValue = attrTypeMap.get("sourceType").toAttribute(MANUAL_INPUT);
        this.expressionBuilder.equals("sourceType", itemValue);

        return this;
    }

}

/**
 * Create transactions.
 * 
 * @param {DynamoDb} dbClient Dynamo DB client
 * @param {string} clientId ID of the user that is inserting this transaction
 * @param {string} accountId Transaction object to update
 * @param {string} walletId Transaction object to update
 * @param {Array<any>} transactionsToAdd attributes to be updated.
 * @param {boolean} overwrite Indicates if the transaction with the same identifiers should be overwritten
 * @param {boolean} generateId Indicates if the transaction id should be generated, if not present
 */
exports.create = async (dbClient, clientId, accountId, walletId, transactionsToAdd, overwrite = false, generateId = false) => {
    if(!dbClient || !accountId || !walletId || !transactionsToAdd) {
        throw new Error("Missing mandatory parameters");
    }

    console.log(`Creating [${transactionsToAdd.length}] transactions for account [${accountId}] and wallet [${walletId}].`);

    const transactions = transactionsToAdd.map(transactionDetails => {
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
        transaction.keyword = transactionDetails.keyword || transactionDetails.description.trim();
        transaction.source = transactionsToAdd.source;
        transaction.sourceType = transactionsToAdd.sourceType;

        // Generate the Tx ID if it is not specified.
        if(!transaction.txId && generateId) {
            transaction.txId = String(new Date().getTime());
        }

        return transaction;
    });

    if(transactions.length == 1) {
        console.log(`Persisting single transaction in DynamoDb: [${JSON.stringify(transactions[0])}]`);
        return dbClient.putItem(transactions[0], overwrite);
    } else {
        return dbClient.putItems(transactions, overwrite);
    }
}

/**
 * List transactions.
 * 
 * @param {DynamoDb} dbClient Dynamo DB client.
 * @param {string} accountId The account ID.
 * @param {string} walletId The wallet ID.
 * @param {TransactionFilter} filter Filters to apply when querying the transactions.
 * @param {string} order Ordering to retrieve the transactions. Either ASC or DESC.
 */
exports.list = async (dbClient, accountId, walletId, filter = new TransactionFilter(), order) => {
    const pk = getPK(accountId);

    const fromWalletId = walletId || "0000";
    const toWalletId = walletId || "9999";
    const from = getSK(fromWalletId, filter.from);
    const to = getSK(toWalletId, filter.to);
    const queryBuilder = new dynamoDbLib.QueryBuilder(pk).sk.between(from, to);
    
    const filterExpression = filter.expression;

    if(filterExpression.expression.length > 0) {
        console.log("Filters:", filterExpression);
        queryBuilder.withFilterExpression(filterExpression);
    }

    const queryData = await dbClient.query(queryBuilder.build());

    const transactions = queryData.Items.map((item) => {
        return dynamoDbLib.fromItem(item, new Transaction());
    });

    if(order == "ASC" || order == "DESC") {
        console.log(`Ordering transactions, [${order}] order`);
        transactions.sort((first, second) => {
            const firstTx = first.dt + first.txId;
            const secondTx = second.dt + second.txId;

            if(order == "ASC") {
                return firstTx.localeCompare(secondTx);
            } else {
                return secondTx.localeCompare(firstTx);
            }
        });
    }

    return transactions;
}

/**
 * Updates a transaction.
 * 
 * @param {DynamoDb} dbClient Dynamo DB client
 * @param {Transaction} transactionToUpdate transaction object to update
 * @param {*} attrsToUpdate attributes to be updated.
 */
exports.update = async (dbClient, transactionToUpdate, attrsToUpdate) => {
    if(!dbClient || !transactionToUpdate || !attrsToUpdate) {
        throw new Error("Missing mandatory parameters");
    }

    validateUpdateParams(transactionToUpdate, attrsToUpdate);

    return dbClient.updateItem(transactionToUpdate, attrsToUpdate);
}

exports.updateAll = async (dbClient, transactionChanges = []) => {

    transactionChanges.forEach((transactionChange, i) => {
        try {
            validateUpdateParams(transactionChange.transaction, transactionChange.updatedAttributes);
        } catch(error) {
            throw new Error(`Item ${i} is invalid: "${error.message}"`);
        }
    });

    const updateParamsList = transactionChanges.map(transactionChange => {
        return new dynamoDbLib.UpdateExpressionBuilder(transactionChange.transaction).updateTo(transactionChange.updatedAttributes).build();
    });

    return dbClient.updateItems(updateParamsList);
}

function validateUpdateParams(transactionToUpdate, attrsToUpdate) {
    if(!transactionToUpdate instanceof Transaction) {
        throw new Error("'transactionToUpdate' must be a Transaction"); 
    }

    for(let attribute in attrsToUpdate) {
        if(!transactionToUpdate.hasOwnProperty(attribute)) {
            throw new Error(`'${attribute}' is not a valid Transaction attribute`);
        }

        if(!updatableAttrs.has(attribute)) {
            throw new Error(`Transaction attribute '${attribute}' is not updatable`);
        }
    }
}

exports.isChangeNotifiable = updatedAttributes => {
    for(let attr in updatedAttributes) {
        if(notifiableAttrs.has(attr)) {
            return true;
        }
    }

    return false;
}

exports.Transaction = Transaction;
exports.TransactionFilter = TransactionFilter;
exports.TransactionChangeSet = TransactionChangeSet;
exports.DEBIT_BALANCE_TYPE = DEBIT_BALANCE_TYPE;
exports.CREDIT_BALANCE_TYPE = CREDIT_BALANCE_TYPE;
exports.AUTO_INPUT = AUTO_INPUT
exports.MANUAL_INPUT = MANUAL_INPUT;
exports.getPK = getPK;
exports.getSK = getSK;