const AWS = require('aws-sdk');
const WalletHandler = require('./walletHandler').WalletHandler;
const walletHandler = new WalletHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    console.log(event);

    // FIX ME change for a utility function
    const accountId = event.pathParameters ? event.pathParameters.accountId : undefined;
    const walletId = event.pathParameters ? event.pathParameters.walletId : undefined;
    const operationMap = accountId && walletId ? walletOperationMap : topLevelOperationMap;
    const operation = operationMap.get(event.httpMethod);

    const response = await walletHandler.handle(operation, event);

    try {
        return new Response(response);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

const topLevelOperationMap = new Map([
    ['GET', 'list' ],
    ['POST', 'create' ]
]);

const walletOperationMap = new Map([
    ['GET', 'get' ],
    ['PUT', 'update' ],
    ['DELETE', 'delete' ]
]);

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