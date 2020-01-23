const uuidv4 = require("uuid/v4");
const transaction = require('../../libs/transaction');
const Transaction = transaction.Transaction;
const dynamodb = require('../../libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const FilterExpressionBuilder = dynamodb.FilterExpressionBuilder;
const fromItem = dynamodb.fromItem;
const getPK = transaction.getPK;
const getSK = transaction.getSK;

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
            transaction.transactionId = transactionDetails.transactionId;
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

            // Generate the Tx ID if it is not specified.
            if(!transaction.transactionId && generateId) {
                transaction.transactionId = uuidv4();
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
        const to = event.queryStringParameters.to;
        const from = event.queryStringParameters.from;

        const pk = getPK(accountId);
        const sk = getSK(accountId, walletId);
        
        const queryBuilder = new QueryBuilder(pk).withSkStartingWith(sk);

        if(to && from) {
            const fromAttr = dynamodb.StringAttributeType.toAttribute(from);
            const toAttr = dynamodb.StringAttributeType.toAttribute(to);
            const dateFilter = new FilterExpressionBuilder().between("dt", fromAttr, toAttr).build();

            queryBuilder.withFilterExpression(dateFilter);
        } else if(to) {
            const toAttr = dynamodb.StringAttributeType.toAttribute(to);
            const dateFilter = new FilterExpressionBuilder().lessThanOrEqual("dt", toAttr).build();
            queryBuilder.withFilterExpression(dateFilter);
        } else if(from) {
            const fromAttr = dynamodb.StringAttributeType.toAttribute(from);
            const dateFilter = new FilterExpressionBuilder().greaterThanOrEqual("dt", fromAttr).build();
            queryBuilder.withFilterExpression(dateFilter);
        }

        const queryData = await this.dbClient.query(queryBuilder.build());
    
        const transactions = queryData.Items.map((item) => {
            return fromItem(item, new Transaction());
        });
    
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
}

exports.TransactionHandler = TransactionHandler;