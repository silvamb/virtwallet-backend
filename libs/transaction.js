const dynamoDbLib = require("./dynamodb");
const UpdateExpressionBuilder = dynamoDbLib.UpdateExpressionBuilder;

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
    }

    return dbClient.updateItem(transactionToUpdate, attrsToUpdate);
}

exports.Transaction = Transaction;
exports.DEBIT_BALANCE_TYPE = DEBIT_BALANCE_TYPE;
exports.CREDIT_BALANCE_TYPE = CREDIT_BALANCE_TYPE;
exports.AUTO_INPUT = AUTO_INPUT
exports.MANUAL_INPUT = MANUAL_INPUT;
exports.getPK = getPK;
exports.getSK = getSK;
exports.getSKAttr = getSKAttr;
exports.getFieldAttrType = (fieldName) => attrTypeMap.get(fieldName);