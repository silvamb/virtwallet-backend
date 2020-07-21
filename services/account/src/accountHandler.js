const account = require('libs/account');
const Account = account.Account;
const DynamoDb = require('libs/dynamodb').DynamoDb;
const fromItem = require('libs/dynamodb').fromItem;

class AccountHandler {

    constructor(dynamodb) {
        console.log("Creating Account Handler");
        this.dynamodb = new DynamoDb(dynamodb);
    }

    async handle(operation, event) {
        console.log(`Invoking operation AccountHandler.${operation}`);

        return await this[operation](event);
    }

    async create(event) {
        const clientId = event.requestContext.authorizer.claims.aud;
        const accountDetails = JSON.parse(event.body);
        
        console.log(`Creating new account for user ${clientId}.`);
    
        const account = new Account();
        account.ownerId = clientId;
        account.name = accountDetails.name;
        account.description = accountDetails.description;
        
        console.log(`New account created: ${JSON.stringify(account)}`);
    
        console.log(`Persisting new account ${account.accountId} in DynamoDb`);

        const item = await this.dynamodb.putItem(account);
    
        console.log(item);
    
        return account;
    }

    async list(event) {
        const clientId = event.requestContext.authorizer.claims.aud;
        console.log(`Listing accounts for user [${clientId}]`);
        
        const pk = Account.getPK(clientId);

        const queryData = await this.dynamodb.queryAll(pk);

        const accounts = queryData.Items.map((item) => {
            return fromItem(item, new Account());
        });

        console.log(`Accounts retrieved for user [${clientId}]: ${accounts.length}`);

        console.log(accounts);

        return accounts;
    }

    async get(event) {
        const ownerId = event.requestContext.authorizer.claims.aud;
        const accountId = event.pathParameters.accountId;
        const pk = Account.getPK(ownerId);
        const sk = Account.getSK(ownerId, accountId);

        const queryData = await this.dynamodb.queryAll(pk, sk);
        const account = fromItem(queryData.Items[0], new Account()); 

        return account;
    }

    async put() {
        throw new Error("Not implemented yet.");
    }

    async delete() {
        throw new Error("Not implemented yet.");
    }
}

exports.AccountHandler = AccountHandler;