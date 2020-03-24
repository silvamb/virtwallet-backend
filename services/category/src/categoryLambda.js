const AWS = require('aws-sdk');
const CategoryHandler = require('./categoryHandler').CategoryHandler;
const categoryHandler = new CategoryHandler(new AWS.DynamoDB());

exports.handle = async event => {
    
    console.log(event);

    // FIX ME change for a utility function
    const accountId = event.pathParameters ? event.pathParameters.accountId : undefined;
    const categoryId = event.pathParameters ? event.pathParameters.categoryId : undefined;
    
    const operationMap = accountId && categoryId ? categoryOperationMap : topLevelOperationMap;
    const operationHandler = operationMap.get(event.httpMethod);

    const response = await operationHandler(event);

    try {
        return new Response(response);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

async function listCategories(event) {
    const clientId = event.requestContext.authorizer.claims.client_id;
    const accountId = event.pathParameters.accountId;

    return await categoryHandler.list(clientId, accountId);
}

async function createCategory(event) {
    const clientId = event.requestContext.authorizer.claims.client_id;
    const accountId = event.pathParameters.accountId;
    const categoriesToAdd = JSON.parse(event.body);

    return await categoryHandler.create(clientId, accountId, categoriesToAdd);
}

async function getCategory(event) {
    const accountId = event.pathParameters.accountId;
    const categoryId = event.pathParameters.categoryId;

    return await categoryHandler.get(accountId, categoryId);
}

async function deleteCategory(event) {
    const clientId = event.requestContext.authorizer.claims.client_id;
    const accountId = event.pathParameters.accountId;
    const categoryId = event.pathParameters.categoryId;

    return await categoryHandler.delete(clientId, accountId, categoryId);
}

async function updateCategory(event) {
    const accountId = event.pathParameters.accountId;
    const category = JSON.parse(event.body);

    return await categoryHandler.update(accountId, categoryId, category);
}

const topLevelOperationMap = new Map([
    ['GET', listCategories ],
    ['POST', createCategory ]
]);

const categoryOperationMap = new Map([
    ['GET', getCategory ],
    ['PUT', updateCategory ],
    ['DELETE', deleteCategory ]
]);

// TODO Extract to a utility function
class Response {
    constructor(data, statusCode = 200){
        this.statusCode = statusCode;
        this.body = JSON.stringify(data);
    }
}