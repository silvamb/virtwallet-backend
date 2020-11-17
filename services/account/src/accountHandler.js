const account = require('libs/account');

const topLevelOperationMap = new Map([
    ['GET', listAccounts ],
    ['POST', createAccount ]
]);

const accountOperationMap = new Map([
    ['GET', getAccount ]
]);


exports.handle = async (event, dynamodb) => {
    const accountId = event.pathParameters? event.pathParameters.accountId : undefined;
    const operationMap = accountId ? accountOperationMap : topLevelOperationMap;
    const operationHandler = operationMap.get(event.httpMethod);

    if(!operationHandler) {
        throw new Error(`Method ${event.httpMethod} for resource ${event.resource} not implemented yet`);
    }

    return operationHandler(event, dynamodb);
}

function createAccount(event, dynamodb) {
    const clientId = event.requestContext.authorizer.claims.sub;
    const accountDetails = JSON.parse(event.body);
    
    return account.create(dynamodb, clientId, accountDetails)
}

function listAccounts(event, dynamodb) {
    const clientId = event.requestContext.authorizer.claims.sub;
    
    return account.list(dynamodb, clientId)
}

function getAccount(event, dynamodb) {
    const clientId = event.requestContext.authorizer.claims.sub;
    const accountId = event.pathParameters.accountId;
    
    return account.retrieve(dynamodb, clientId, accountId)
}