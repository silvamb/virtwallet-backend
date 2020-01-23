const AWS = require('aws-sdk');
const AccountHandler = require('./accountHandler').AccountHandler;
const accountHandler = new AccountHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    console.log(event);

    // FIX ME change for a utility function
    const accountId = event.pathParameters? event.pathParameters.accountId : undefined;
    const operationMap = accountId ? accountOperationMap : topLevelOperationMap;
    const operation = operationMap.get(event.httpMethod);

    const response = await accountHandler.handle(operation, event);

    try {
        return new AccountResponse(response);
    } catch(err) {
        return new AccountResponse({message: err.message}, 500);
    }
};

const topLevelOperationMap = new Map([
    ['GET', 'list' ],
    ['POST', 'create' ]
]);

const accountOperationMap = new Map([
    ['GET', 'get' ],
    ['PUT', 'update' ],
    ['DELETE', 'delete' ]
]);

class AccountResponse {
    constructor(data, statusCode = 200){
        this.statusCode = statusCode;
        this.body = JSON.stringify(data);
    }
}