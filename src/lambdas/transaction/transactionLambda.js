const AWS = require('aws-sdk');
const TransactionHandler = require('./transactionHandler').TransactionHandler;
const transactionHandler = new TransactionHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    // FIX ME change for a utility function
    const accountId = event.pathParameters ? event.pathParameters.accountId : undefined;
    const transactionId = event.pathParameters ? event.pathParameters.transactionId : undefined;
    const operationMap = accountId && transactionId ? transactionOperationMap : topLevelOperationMap;
    const operation = operationMap.get(event.httpMethod);

    const response = await transactionHandler.handle(operation, event);

    try {
        return new Response(response);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

const topLevelOperationMap = new Map([
    ['GET', 'list' ],
    ['PUT', 'create' ]
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
    }
}