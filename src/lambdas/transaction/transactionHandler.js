const transaction = require('../../libs/transaction');
const Transaction = transaction.Transaction;
const dynamodb = require('../../libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const ExpressionBuilder = dynamodb.ExpressionBuilder;
const fromItem = dynamodb.fromItem;
const SK = dynamodb.SK;
const getPK = transaction.getPK;
const getSKAttr = transaction.getSKAttr;

class TransactionHandler {
    constructor(dbClient) {
        console.log("Creating Transaction Handler");
        this.dbClient = new DynamoDb(dbClient);
    }

    async handle(operation, event) {
        console.log(`Invoking operation TransactionHandler.${operation}`);

        if(!this[operation]) {
            throw new Error(`Invalid operation TransactionHandler.${operation}`);
        }

        return await this[operation](event);
    }

    async create(event) {
        const clientId = event.requestContext.authorizer.claims.client_id;
        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;
        const generateId = true;
        const transactionsToAdd = JSON.parse(event.body);

        // TODO validate if user is a member of this account
        // TODO validate transaction details

        console.log(`Creating transactions for user ${clientId} and wallet ${walletId}.`);
    
        const transactions = transactionsToAdd.transactions.map((transactionDetails) => {
            const transaction = new Transaction();
            transaction.txId = transactionDetails.txId;
            transaction.txDate = transactionDetails.txDate;
            transaction.accountId = accountId;
            transaction.walletId = walletId;
            transaction.dt = transactionDetails.dt;
            transaction.value = transactionDetails.value;
            transaction.description = transactionDetails.description;
            transaction.balance = transactionDetails.balance;
            transaction.balanceType = transactionDetails.balanceType;
            transaction.includedBy = clientId;
            transaction.category = transactionDetails.category;
            transaction.source = transactionsToAdd.source;
            transaction.sourceType = transactionsToAdd.sourceType;

            // Generate the Tx ID if it is not specified.
            if(!transaction.txId && generateId) {
                transaction.txId = String(new Date().getTime());
            }

            return transaction;
        });

        let retVal;

        if(transactions.length == 1) {
            console.log(`Persisting single transaction in DynamoDb: [${JSON.stringify(transactions[0])}]`);
            const item = await this.dbClient.putItem(transactions[0]);

            console.log("Put item returned.");
            console.log(item);

            retVal = item;
        } else {
            retVal = await this.dbClient.putItems(transactions);
        }

        return retVal;
    }

    async list(event) {
        const clientId = event.requestContext.authorizer.claims.client_id;
        // TODO validate if the client has permissions to access the wallet.
    
        console.log(event);

        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;
        let to = event.queryStringParameters.to;
        let from = event.queryStringParameters.from;

        const pk = getPK(accountId);
        const queryBuilder = new QueryBuilder(pk);

        if(!from) {
            from = "0000-00-00";
        }

        if(!to) {
           to = "9999-99-99";
        }

        const fromAttr = getSKAttr(from, walletId);
        const toAttr = getSKAttr(to, walletId);
        const skExpression = new ExpressionBuilder().between(SK, fromAttr, toAttr).build();
        queryBuilder.withSkExpression(skExpression); 

        const queryData = await this.dbClient.query(queryBuilder.build());
    
        const transactions = queryData.Items.map((item) => {
            return fromItem(item, new Transaction());
        });
    
        console.log(transactions);

        return transactions;
    }

    async get(_event) {
        throw new Error("Operation TransactionHandler.get not implemented yet");
    }

    async update(_event) {
        throw new Error("Operation TransactionHandler.update not implemented yet");
    }

    async delete(_event) {
        throw new Error("Operation TransactioHandler.delete not implemented yet");
    }

    async deleteAll(event) {
        const clientId = event.requestContext.authorizer.claims.client_id;
        // TODO validate if the client has permissions to access the wallet.
    
        console.log(event);

        const accountId = event.pathParameters.accountId;
        const walletId = event.pathParameters.walletId;

        const pk = getPK(accountId);
        const fromAttr = getSKAttr("0000-00-00", walletId);
        const toAttr = getSKAttr("9999-99-99", walletId);
        const skExpression = new ExpressionBuilder().between(SK, fromAttr, toAttr).build();
        const query = new QueryBuilder(pk).withSkExpression(skExpression).returnKeys().build();
        const queryData = await this.dbClient.query(query);

        console.log(`Returned ${queryData.Items.length} items to delete`);

        const deleteAllResult = await this.dbClient.deleteAll(queryData.Items);

        return deleteAllResult;
    }
}

exports.TransactionHandler = TransactionHandler;