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

const getSKAttr = (walletId, txDate, txId) => {
    const sk = getSK(walletId, txDate, txId);
    return dynamoDbLib.StringAttributeType.toAttribute(sk);
}

class TransactionChangeSet {
    constructor(attrName, oldValue, newValue) {
        this.attributeName = attrName;
        this.oldValue = oldValue;
        this.newValue = newValue;
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
        this.type = "POS";
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

    getChanges(anotherTransaction) {
        const changeSet = new Set();

        let currentValue, newValue;
        attrsToCompare.forEach((attrName) => {
            currentValue = this[attrName];
            newValue = anotherTransaction[attrName];
            if(currentValue !== newValue) {
                changeSet.add(new TransactionChangeSet(attrName, currentValue, newValue));
            }
        });

        return changeSet;
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
    // TODO validate if user is a member of this account
    // TODO validate transaction details

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
 * @param {string} from Initial date (inclusive) to retrieve the transactions.
 * @param {string} to End date (inclusive) to retrieve the transactions.
 * @param {string} order Ordering to retrieve the transactions. Either ASC or DESC.
 */
exports.list = async (dbClient, accountId, walletId, from = "9999-99-99", to = "0000-00-00", order) => {
    const pk = getPK(accountId);

    const fromWalletId = walletId || "0000";
    const toWalletId = walletId || "9999";
    const fromAttr = getSKAttr(fromWalletId, from);
    const toAttr = getSKAttr(toWalletId, to);
    const skExpression = new dynamoDbLib.ExpressionBuilder().between(dynamoDbLib.SK, fromAttr, toAttr).build();
    const queryBuilder = new dynamoDbLib.QueryBuilder(pk).withSkExpression(skExpression);

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

    return dbClient.updateItem(transactionToUpdate, attrsToUpdate);
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
exports.DEBIT_BALANCE_TYPE = DEBIT_BALANCE_TYPE;
exports.CREDIT_BALANCE_TYPE = CREDIT_BALANCE_TYPE;
exports.AUTO_INPUT = AUTO_INPUT
exports.MANUAL_INPUT = MANUAL_INPUT;
exports.getPK = getPK;
exports.getSK = getSK;
exports.getSKAttr = getSKAttr;
exports.getFieldAttrType = fieldName => attrTypeMap.get(fieldName);