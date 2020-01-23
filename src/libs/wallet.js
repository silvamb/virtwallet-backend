const dynamodb = require("./dynamodb");

const CHECKING_ACCOUNT = "checking_account";
const CREDIT_CARD = "credit_card";
const CASH = "cash";
const SAVINGS_ACCOUNT = "savings_account";

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["walletId", dynamodb.StringAttributeType],
    ["ownerId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType],
    ["type", dynamodb.StringAttributeType]
]);



const getPK = (accountId) => `ACCOUNT#${accountId}`;
const getSK = (accountId, walletId) => `WALLET#${accountId}#${walletId}`;

const isTypeValid = (type) => {
    return [CHECKING_ACCOUNT, CREDIT_CARD, CASH, SAVINGS_ACCOUNT].indexOf(type) >= 0;
};


class Wallet {

    constructor() {
        this.accountId = "";
        this.walletId = "";
        this.ownerId = "";
        this.name = "";
        this.description = "";
        this.type = "";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.accountId, this.walletId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }
}

exports.Wallet = Wallet;
exports.CHECKING_ACCOUNT = CHECKING_ACCOUNT;
exports.CREDIT_CARD = CREDIT_CARD;
exports.CASH = CASH;
exports.SAVINGS_ACCOUNT = SAVINGS_ACCOUNT;
exports.getPK = getPK;
exports.getSK = getSK;
exports.isTypeValid = isTypeValid;
