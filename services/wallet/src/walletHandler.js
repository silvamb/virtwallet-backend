const wallet = require('libs/wallet');
const { createVersionForCreatedItems, publishChangeSet } = require('libs/version');

class WalletHandler {

    constructor(dynamodb, eventbridge) {
        console.log("Creating Wallet Handler");
        this.dynamodb = dynamodb;
        this.eventbridge = eventbridge;
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

        const createWalletResult = await wallet.create(this.dynamodb, clientId, accountId, walletDetails);
    
        const changeSet = await createVersionForCreatedItems({dynamodb: this.dynamodb, accountId, results: [createWalletResult]});

        if(changeSet) {
            await publishChangeSet(this.eventbridge, changeSet);
        }
    
        return createWalletResult;
    }

    async list(event) {
        const accountId = event.pathParameters.accountId;
        return wallet.list(this.dynamodb, accountId);
    }

    async get(event) {
        const ownerId = event.requestContext.authorizer.claims.aud;

        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;
        return wallet.retrieve(this.dynamodb, accountId, walletId);
    }

    async update(event) {
        throw new Error("Operation WalletHandler.update not implemented yet");
    }

    async delete(event) {
        throw new Error("Operation WalletHandler.delete not implemented yet");
    }
}

exports.WalletHandler = WalletHandler;