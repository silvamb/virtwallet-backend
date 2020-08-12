const uuidv4 = require("uuid/v4");
const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const fromItem = dynamodb.fromItem;

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["ownerId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType]
]);


function getPK(ownerId) {
    return `USER#${ownerId}`;
}

function getSK(ownerId, accountId) {
    return `ACCOUNT#${ownerId}#${accountId}`;
}

class Account {

    constructor(accountId = uuidv4()) {
        this.accountId = accountId;
        this.ownerId = "";
        this.name = "";
        this.description = "";
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

exports.create = async (dynamodb, clientId, accountDetails) => {   
    console.log(`Creating new account for user ${clientId}.`);

    const dbClient = new DynamoDb(dynamodb);

    const account = new Account();
    account.ownerId = clientId;
    account.name = accountDetails.name;
    account.description = accountDetails.description;


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

    const accounts = queryData.Items.map((item) => {
        return fromItem(item, new Account());
    });

    console.log(`Accounts retrieved for user [${clientId}]: ${accounts.length}`);

    console.log(accounts);

    return accounts;
}

exports.retrieve = async (dynamodb, ownerId, accountId) => {
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(ownerId);
    const sk = getSK(ownerId, accountId);

    const queryData = await dbClient.queryAll(pk, sk);
    const account = fromItem(queryData.Items[0], new Account()); 

    return account;
}

exports.Account = Account;