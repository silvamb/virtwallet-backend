const wallet = require('libs/wallet');
const Wallet = wallet.Wallet;
const DynamoDb = require('libs/dynamodb').DynamoDb;
const QueryBuilder = require('libs/dynamodb').QueryBuilder;
const fromItem = require('libs/dynamodb').fromItem;
const getPK = wallet.getPK;
const getSK = wallet.getSK;

class WalletHandler {

    constructor(dynamodb) {
        console.log("Creating Wallet Handler");
        this.dynamodb = new DynamoDb(dynamodb);
    }

    async handle(operation, event) {
        console.log(`Invoking operation WalletHandler.${operation}`);

        if(!this[operation]) {
            throw new Error(`Invalid operation WalletHandler.${operation}`);
        }

        return await this[operation](event);
    }

    async create(event) {
        const clientId = event.requestContext.authorizer.claims.aud;
        const accountId = event.pathParameters.accountId;

        const walletDetails = JSON.parse(event.body);
    
        // TODO validate if user is a member of this account

        const pk = getPK(accountId);
        const skPrefix = getSK(accountId);
        const nextWalletId = await this.dynamodb.getNext(pk, skPrefix);
        const walletId = String(nextWalletId).padStart(4, '0');
        console.log(`Creating new wallet ${walletId} for user ${clientId} and account ${accountId}.`);
    
        const wallet = new Wallet();
        wallet.walletId = walletId;
        wallet.accountId = accountId;
        wallet.ownerId = clientId;
        wallet.name = walletDetails.name;
        wallet.description = walletDetails.description;
        wallet.type = walletDetails.type;

        console.log(`New wallet created: ${JSON.stringify(wallet)}`);
    
        console.log(`Persisting new wallet ${wallet.accountId} in DynamoDb`);

        const item = await this.dynamodb.putItem(wallet);
    
        console.log(item);
    
        return wallet;
    }

    async list(event) {
        const clientId = event.requestContext.authorizer.claims.aud;
        // TODO validate if user is a member of this account

        const accountId = event.pathParameters.accountId;
        console.log(`Listing wallets for account [${accountId}]`);
        
        const pk = getPK(accountId);
        const sk = getSK(accountId);

        const queryBuilder = new QueryBuilder(pk).sk.beginsWith(sk);
        const queryData = await this.dynamodb.query(queryBuilder.build());

        const wallets = queryData.Items.map((item) => {
            return fromItem(item, new Wallet());
        });

        console.log(`Wallets retrieved for account [${accountId}]: ${wallets.length}`);
        console.log(wallets);

        return wallets;
    }

    async get(event) {
        const ownerId = event.requestContext.authorizer.claims.aud;
        // TODO validate if user is a member of this account

        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;
        const pk = getPK(accountId);
        const sk = getSK(accountId, walletId);

        const queryData = await this.dynamodb.queryAll(pk, sk);
        const wallet = fromItem(queryData.Items[0], new Wallet()); 

        return wallet;
    }

    async update(event) {
        throw new Error("Operation WalletHandler.update not implemented yet");
    }

    async delete(event) {
        throw new Error("Operation WalletHandler.delete not implemented yet");
    }
}

exports.WalletHandler = WalletHandler;