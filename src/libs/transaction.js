const dynamodb = require("./dynamodb");

const DEBIT_BALANCE_TYPE = 'Debit';
const CREDIT_BALANCE_TYPE = 'Credit';


const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["walletId", dynamodb.StringAttributeType],
    ["dt", dynamodb.StringAttributeType],
    ["transactionId", dynamodb.StringAttributeType],
    ["value", dynamodb.NumberAttributeType],
    ["description", dynamodb.StringAttributeType],
    ["type", dynamodb.StringAttributeType],
    ["balance", dynamodb.NumberAttributeType],
    ["balanceType", dynamodb.StringAttributeType],
    ["includedBy", dynamodb.StringAttributeType],
    ["version", dynamodb.NumberAttributeType],
    ["category", dynamodb.StringAttributeType],
    ["source", dynamodb.StringAttributeType],
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
const getSK = (accountId, walletId, transactionId) => {
    if(transactionId) {
        return `TRANSACTION#${accountId}#${walletId}#${transactionId}`;
    } else {
        return `TRANSACTION#${accountId}#${walletId}`;
    }
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
        this.accountId = "";
        this.walletId = "";
        this.transactionId = "";
        this.dt = "";
        this.value = 0.00;
        this.description = "New transaction";
        this.type = "POS";
        this.balance = 0.00;
        this.balanceType = DEBIT_BALANCE_TYPE;
        this.includedBy = "";
        this.version = 1;
        this.category = ""; // TODO transform to a Class
        this.source = "MANUAL";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.accountId, this.walletId, this.transactionId);
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
exports.getPK = getPK;
exports.getSK = getSK;