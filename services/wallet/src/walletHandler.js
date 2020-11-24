const wallet = require('libs/wallet');
const { createVersionForCreatedItems, createVersionForUpdatedItems, publishChangeSet } = require('libs/version');

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
        const clientId = event.requestContext.authorizer.claims.sub;
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
        const ownerId = event.requestContext.authorizer.claims.sub;

        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;
        return wallet.retrieve(this.dynamodb, accountId, walletId);
    }

    async update(event) {
        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;

        if(!accountId || !walletId || walletId === "") {
            throw new Error("Invalid path parameters");
        }

        const changeSet = JSON.parse(event.body);
        const oldAttributes = changeSet.old;
        const attributesToUpdate = changeSet.new;

        if(!oldAttributes || !attributesToUpdate) {
            throw new Error("Event body invalid for Wallet update");
        }

        console.log("Updating wallet [", walletId, "] attributes from", oldAttributes, "to", attributesToUpdate);
        const walletToUpdate = new wallet.Wallet(accountId, walletId);

        for(let attribute in oldAttributes) {
            if(walletToUpdate.hasOwnProperty(attribute) 
                && (oldAttributes[attribute] === null || typeof(walletToUpdate[attribute]) === typeof(oldAttributes[attribute]))) {
                walletToUpdate[attribute] = oldAttributes[attribute];
            } else {
                throw new Error(`Old attribute '${attribute}' is not a valid Wallet attribute`);
            }
        }

        // Check if some update attribute doesn't have the old value
        for(let updatedAttribute in attributesToUpdate) {
            if(!oldAttributes.hasOwnProperty(updatedAttribute)) {
                throw new Error(`Missing old value for attribute '${updatedAttribute}'`);
            }

            if(!walletToUpdate.hasOwnProperty(updatedAttribute)
                || typeof(walletToUpdate[updatedAttribute]) !== typeof(attributesToUpdate[updatedAttribute])) {
                throw new Error(`New attribute '${updatedAttribute}' is not a valid Wallet attribute`);
            }
        }

        const updateWalletResult = await wallet.update(this.dynamodb, walletToUpdate, attributesToUpdate);

        const versionedChangeSet = await createVersionForUpdatedItems({dynamodb: this.dynamodb, accountId, results: [updateWalletResult]});

        if(versionedChangeSet) {
            await publishChangeSet(this.eventbridge, versionedChangeSet);
        }

        return updateWalletResult;
    }

    async delete(event) {
        throw new Error("Operation WalletHandler.delete not implemented yet");
    }
}

exports.WalletHandler = WalletHandler;