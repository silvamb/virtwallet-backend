const dynamodb = require("./dynamodb");

const DEBIT_BALANCE_TYPE = 'Debit';
const CREDIT_BALANCE_TYPE = 'Credit';
const AUTO_INPUT = 'A';
const MANUAL_INPUT = 'M';

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["walletId", dynamodb.StringAttributeType],
    ["txDate", dynamodb.StringAttributeType],
    ["txId", dynamodb.StringAttributeType],
    ["dt", dynamodb.StringAttributeType],
    ["value", dynamodb.NumberAttributeType],
    ["description", dynamodb.StringAttributeType],
    ["type", dynamodb.StringAttributeType],
    ["balance", dynamodb.NumberAttributeType],
    ["balanceType", dynamodb.StringAttributeType],
    ["includedBy", dynamodb.StringAttributeType],
    ["version", dynamodb.NumberAttributeType],
    ["category", dynamodb.StringAttributeType],
    ["keyword", dynamodb.StringAttributeType],
    ["source", dynamodb.StringAttributeType],
    ["sourceType", dynamodb.StringAttributeType],
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
    return dynamodb.StringAttributeType.toAttribute(sk);
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
        this.category = ""; // TODO transform to a Class
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

exports.Transaction = Transaction;
exports.DEBIT_BALANCE_TYPE = DEBIT_BALANCE_TYPE;
exports.CREDIT_BALANCE_TYPE = CREDIT_BALANCE_TYPE;
exports.AUTO_INPUT = AUTO_INPUT
exports.MANUAL_INPUT = MANUAL_INPUT;
exports.getPK = getPK;
exports.getSK = getSK;
exports.getSKAttr = getSKAttr;
exports.getFieldAttrType = (fieldName) => attrTypeMap.get(fieldName);