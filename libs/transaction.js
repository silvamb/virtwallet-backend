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
    ["versionId", dynamoDbLib.NumberAttributeType],
    ["categoryId", dynamoDbLib.StringAttributeType],
    ["keyword", dynamoDbLib.StringAttributeType],
    ["source", dynamoDbLib.StringAttributeType],
    ["sourceType", dynamoDbLib.StringAttributeType],
    ["referenceMonth", dynamoDbLib.StringAttributeType],
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
        this.versionId = 1;
        this.categoryId = "";
        this.keyword = "";
        this.source = "MANUAL";
        this.sourceType = MANUAL_INPUT;
        this.referenceMonth = "";
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

    getType() {
        return "Transaction";
    }
}

class TransactionFilter {
    
    constructor() {
        this.expressionBuilder = new dynamoDbLib.ExpressionBuilder();
        this.from = "0000-00-00";
        this.to = "9999-99-99";
    }

    get expression() {
        return this.expressionBuilder.build();
    }

    between(from = "0000-00-00", to = "9999-99-99") {
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
 * @param {AWS.DynamoDb} dynamodb AWS Dynamo DB client
 * @param {string} clientId ID of the user that is inserting this transaction
 * @param {string} accountId Transaction object to update
 * @param {string} walletId Transaction object to update
 * @param {Array<any>} transactionsToAdd attributes to be updated.
 * @param {boolean} overwrite Indicates if the transaction with the same identifiers should be overwritten
 * @param {boolean} generateId Indicates if the transaction id should be generated, if not present
 */
exports.create = async (dynamodb, clientId, accountId, walletId, transactionsToAdd, overwrite = false, generateId = false) => {
    if(!dynamodb || !accountId || !walletId || !transactionsToAdd) {
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
        transaction.referenceMonth = transactionDetails.referenceMonth;

        if(transactionDetails.source && transactionDetails.sourceType) {
            transaction.source = transactionDetails.source;
            transaction.sourceType = transactionDetails.sourceType;
        }

        // Generate the Tx ID if it is not specified.
        if(!transaction.txId && generateId) {
            transaction.txId = String(new Date().getTime());
        }

        return transaction;
    });

    const dbClient = new dynamoDbLib.DynamoDb(dynamodb);
    const putItemsResult = await dbClient.putItems(transactions, overwrite);

    return putItemsResult.map((putItemResult, index) => {
        if(putItemResult.success) {
            return {
                data: transactions[index]
            }
        } else {
            return {
                err: putItemResult.data
            }
        }
    });
}

/**
 * List transactions.
 * 
 * @param {AWS.DynamoDb} dbClient AWS Dynamo DB
 * @param {string} accountId The account ID.
 * @param {string} walletId The wallet ID.
 * @param {TransactionFilter} filter Filters to apply when querying the transactions.
 * @param {string} order Ordering to retrieve the transactions. Either ASC or DESC.
 */
exports.list = async (dynamodb, accountId, walletId, filter = new TransactionFilter(), order) => {
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

    const dbClient = new dynamoDbLib.DynamoDb(dynamodb);
    const queryData = await dbClient.query(queryBuilder.build());

    const transactions = queryData.Items.map((item) => {
        return dynamoDbLib.fromItem(item, new Transaction());
    });

    if(order === "ASC" || order === "DESC") {
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
 * @param {AWS.DynamoDb} dynamodb AWS Dynamo DB client
 * @param {Transaction} transactionToUpdate transaction object to update
 * @param {*} attrsToUpdate attributes to be updated.
 */
exports.update = async (dynamodb, transactionToUpdate, attrsToUpdate) => {
    if(!dynamodb || !transactionToUpdate || !attrsToUpdate) {
        throw new Error("Missing mandatory parameters");
    }

    validateUpdateParams(transactionToUpdate, attrsToUpdate);

    const dbClient = new dynamoDbLib.DynamoDb(dynamodb);
    const updateItemResult = await dbClient.updateItem(transactionToUpdate, attrsToUpdate);

    if(updateItemResult.success) {
        return {
            data: dynamoDbLib.fromItem(updateItemResult.data.Attributes, new Transaction())
        }
    } else {
        return {
            err: updateItemResult.data
        }
    }
}

exports.updateAll = async (dynamodb, transactionChanges = []) => {

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

    const dbClient = new dynamoDbLib.DynamoDb(dynamodb);
    const updateItemsResult = await dbClient.updateItems(updateParamsList);

    return updateItemsResult.map(updateItemResult => {
        if(updateItemResult.success) {
            return {
                data: fromItem(updateItemResult.data.Attributes, new Transaction())
            }
        } else {
            return {
                err: updateItemResult.data
            }
        }
    });
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