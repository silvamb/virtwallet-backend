const uuidv4 = require("uuid/v4");
const dynamodb = require("./dynamodb");

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["ownerId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType]
]);

class Account {

    constructor(accountId = uuidv4()) {
        this.accountId = accountId;
        this.ownerId = "";
        this.name = "";
        this.description = "";
    }

    getHash() {
        return Account.getPK(this.ownerId);
    }

    getRange() {
        return Account.getSK(this.ownerId, this.accountId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }

    static getPK(ownerId) {
        return `USER#${ownerId}`;
    }

    static getSK(ownerId, accountId) {
        return `ACCOUNT#${ownerId}#${accountId}`;
    }
}

exports.Account = Account;