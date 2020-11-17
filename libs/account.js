const uuidv4 = require("uuid/v4");
const dynamodb = require("./dynamodb");
const dateUtils = require("../libs/dateUtils");
const MonthStartDateRule = dateUtils.MonthStartDateRule;
const DynamoDb = dynamodb.DynamoDb;
const fromItem = dynamodb.fromItem;

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["ownerId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType],
    ["monthStartDateRule", dynamodb.JSONAttributeType],
]);


const metadataAttrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["version", dynamodb.NumberAttributeType],
]);

function getPK(ownerId) {
    return `USER#${ownerId}`;
}

function getSK(ownerId, accountId) {
    return `ACCOUNT#${ownerId}#${accountId}`;
}

function convertToAccount(item) {
    const account = fromItem(item, new Account());

    if(!(account.monthStartDateRule instanceof MonthStartDateRule)) {
        account.monthStartDateRule = new MonthStartDateRule(account.monthStartDateRule);
    }

    return account;
}

class Account {

    constructor(accountId = uuidv4()) {
        this.accountId = accountId;
        this.ownerId = "";
        this.name = "";
        this.description = "";
        this.monthStartDateRule = new MonthStartDateRule();
    }

    getHash() {
        return getPK(this.ownerId);
    }

    getRange() {
        return getSK(this.ownerId, this.accountId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }
}

class AccountMetadata {
    constructor(accountId = "") {
        this.accountId = accountId;
        this.version = 1;
    }

    getHash() {
        return `ACCOUNT#${this.accountId}`;
    }

    getRange() {
        return "METADATA";
    }

    getAttrTypeMap() {
        return metadataAttrTypeMap;
    }
}

exports.create = async (dynamodb, clientId, accountDetails) => {   
    console.log(`Creating new account for user ${clientId}.`);

    const dbClient = new DynamoDb(dynamodb);

    const account = new Account();
    account.ownerId = clientId;
    account.name = accountDetails.name;
    account.description = accountDetails.description;

    if(accountDetails.monthStartDateRule) {
        account.monthStartDateRule = accountDetails.monthStartDateRule;
    }

    console.log(`New account created: ${JSON.stringify(account)}`);

    console.log(`Persisting new account ${account.accountId} in DynamoDb`);

    const item = await dbClient.putItem(account);

    console.log("Put item result", item);

    return account;
}

exports.list = async (dynamodb, clientId) => {
    console.log(`Listing accounts for user [${clientId}]`);
    
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(clientId);

    const queryData = await dbClient.queryAll(pk);

    const accounts = queryData.Items.map(convertToAccount);

    console.log(`Accounts retrieved for user [${clientId}]: ${accounts.length}`);

    console.log(accounts);

    return accounts;
}

exports.retrieve = async (dynamodb, ownerId, accountId) => {
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(ownerId);
    const sk = getSK(ownerId, accountId);

    console.log("Retrieving account:", accountId, ", Owner:", ownerId);
    const queryData = await dbClient.queryAll(pk, sk);
    const account = convertToAccount(queryData.Items[0]); 

    return account;
}

exports.getAll = async (dynamodb, accountId) => {
    console.log(`Retrieving all data from ${accountId}.`);

    const dbClient = new DynamoDb(dynamodb);

    const pk = `ACCOUNT#${accountId}`;
    const data = await dbClient.queryAll(pk);

    return data;
}

exports.Account = Account;
exports.AccountMetadata = AccountMetadata;