const AWS = require('aws-sdk');
const TransactionHandler = require('./transactionHandler').TransactionHandler;
const transactionHandler = new TransactionHandler(new AWS.DynamoDB(), new AWS.EventBridge());

exports.handle = async event => {
    
    try {
        const parameters = parseEvent(event);

        // FIX ME change for a utility function
        const accountId = parameters.accountId;
        const txId = parameters.txId;
        const operationMap = accountId && txId ? transactionOperationMap : topLevelOperationMap;
        const operation = operationMap.get(event.httpMethod);

        const response = await transactionHandler.handle(operation, parameters);

        return new Response(response);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

function parseEvent(event) {
    console.log("Parsing event:", event);

    const transactions = event.body ? JSON.parse(event.body) : undefined;

    return {
        clientId: event.requestContext.authorizer.claims.aud,
        accountId: event.pathParameters.accountId,
        walletId: event.pathParameters.walletId,
        txDate: transactions !== undefined ? transactions.txDate : undefined,
        txId: event.pathParameters.transactionId,
        transactions: transactions,
        generateId: event.queryStringParameters && event.queryStringParameters.generateId,
        to: event.queryStringParameters ? event.queryStringParameters.to : null,
        from: event.queryStringParameters ? event.queryStringParameters.from : null,
        order: event.queryStringParameters ? event.queryStringParameters.order : null,
    };
}

const topLevelOperationMap = new Map([
    ['GET', 'list' ],
    ['PUT', 'create' ],
    ['DELETE', 'deleteAll']
]);

const transactionOperationMap = new Map([
    ['GET', 'get' ],
    ['PUT', 'update' ],
    ['DELETE', 'delete' ]
]);

// TODO Extract to a utilty function
class Response {
    constructor(data, statusCode = 200){
        this.statusCode = statusCode;
        this.body = JSON.stringify(data);

        if(process.env.CORS_ALLOWED_ORIGIN) {
            this.headers = {
                'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN,
                'Access-Control-Allow-Credentials': true,
            };
        }
    }
}