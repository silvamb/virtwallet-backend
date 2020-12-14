const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const UpdateExpressionBuilder = dynamodb.UpdateExpressionBuilder;
const fromItem = dynamodb.fromItem;


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
    ["type", dynamodb.StringAttributeType],
    ["versionId", dynamodb.NumberAttributeType],
    ["balance", dynamodb.NumberAttributeType]
]);

const updatableAttributes = new Set([
    "name",
    "description",
    "balance"
]);

const getPK = (accountId) => `ACCOUNT#${accountId}`;
const getSK = (accountId, walletId) => {
    const sk = `WALLET#`;
    
    const skParts = [accountId, walletId].filter(v => v !== undefined).join('#');
    
    if(skParts) {
        return sk.concat(skParts);
    }

    return sk;
}

const isTypeValid = (type) => {
    return [CHECKING_ACCOUNT, CREDIT_CARD, CASH, SAVINGS_ACCOUNT].indexOf(type) >= 0;
};


class Wallet {

    constructor(accountId = "", walletId = "") {
        this.accountId = accountId;
        this.walletId = walletId;
        this.ownerId = "";
        this.name = "";
        this.description = "";
        this.type = "";
        this.versionId = 1;
        this.balance = 0;
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

    getType() {
        return "Wallet";
    }
}

exports.create = async (dynamodb, clientId, accountId, walletDetails) => {
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);
    const skPrefix = getSK(accountId);
    const nextWalletId = await dbClient.getNext(pk, skPrefix);
    const walletId = String(nextWalletId).padStart(4, '0');
    console.log(`Creating new wallet ${walletId} for user ${clientId} and account ${accountId}.`);

    const wallet = new Wallet(accountId, walletId);
    wallet.ownerId = clientId;
    wallet.name = walletDetails.name;
    wallet.description = walletDetails.description;
    wallet.type = walletDetails.type;
    wallet.balance = walletDetails.balance || 0;

    console.log(`New wallet created: ${JSON.stringify(wallet)}`);

    console.log(`Persisting new wallet ${wallet.accountId} in DynamoDb`);

    const putItemResult = await dbClient.putItem(wallet);

    if(putItemResult.success) {
        return {
            data: wallet
        }
    } else {
        return {
            err: putItemResult.data
        }
    }
}

exports.list = async (dynamodb, accountId) => {
    const dbClient = new DynamoDb(dynamodb);

    console.log(`Listing wallets for account [${accountId}]`);
        
    const pk = getPK(accountId);
    const sk = getSK(accountId);

    const queryBuilder = new QueryBuilder(pk).sk.beginsWith(sk);
    const queryData = await dbClient.query(queryBuilder.build());

    const wallets = queryData.Items.map((item) => {
        return fromItem(item, new Wallet());
    });

    console.log(`Wallets retrieved for account [${accountId}]: ${wallets.length}`);
    console.log(wallets);

    return wallets;
}

exports.retrieve = async (dynamodb, accountId, walletId) => {
    const dbClient = new DynamoDb(dynamodb);
    const pk = getPK(accountId);
    const sk = getSK(accountId, walletId);

    const queryData = await dbClient.queryAll(pk, sk);
    const wallet = fromItem(queryData.Items[0], new Wallet()); 

    return wallet;
}

exports.update = async (dynamodb, walletToUpdate, attributesToUpdate) => {
    if(!dynamodb || !walletToUpdate || !attributesToUpdate) {
        throw new Error("Missing mandatory parameters");
    }

    const dbClient = new DynamoDb(dynamodb);

    if(!walletToUpdate instanceof Wallet) {
        throw new Error("Invalid format, expecting a Wallet"); 
    }

    for(let attribute in attributesToUpdate) {
        if(!walletToUpdate.hasOwnProperty(attribute)) {
            throw new Error(`'${attribute}' is not a valid Wallet attribute`);
        }

        if(!updatableAttributes.has(attribute)) {
            throw new Error(`Wallet attribute '${attribute}' is not updatable`);
        }
    }

    const updateItemResult = await dbClient.updateItem(walletToUpdate, attributesToUpdate);

    if(updateItemResult.success) {
        return {
            data: fromItem(updateItemResult.data.Attributes, new Wallet())
        }
    } else {
        return {
            err: updateItemResult.data
        }
    }
}

exports.updateBalance = async (dynamodb, wallet, balance) => {
    console.log("Updating balance for account:", wallet.accountId,", wallet:", wallet.walletId, ", balance:", balance);
    const dbClient = new DynamoDb(dynamodb);
    
    const updateWalletParams = new UpdateExpressionBuilder(wallet).addTo("balance", balance).addTo("versionId", 1).build();
    const [ updateItemResult ] = await dbClient.updateItems([updateWalletParams]);

    if(updateItemResult.success) {
        return {
            data: fromItem(updateItemResult.data.Attributes, wallet)
        }
    } else {
        return {
            err: updateItemResult.data
        }
    }
}

exports.Wallet = Wallet;
exports.CHECKING_ACCOUNT = CHECKING_ACCOUNT;
exports.CREDIT_CARD = CREDIT_CARD;
exports.CASH = CASH;
exports.SAVINGS_ACCOUNT = SAVINGS_ACCOUNT;
exports.isTypeValid = isTypeValid;
