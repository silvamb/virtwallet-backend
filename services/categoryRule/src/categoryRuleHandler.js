const categoryRule = require('libs/categoryRule');

exports.handle = async (event, dynamodb) => {
    const operationMap = new Map([
        ['GET', listCategoryRules ],
        ['POST', createCategoryRule ]
    ]);

    const operationHandler = operationMap.get(event.httpMethod);

    if(!operationHandler) {
        throw new Error(`Method ${event.httpMethod} for resource ${event.resource} not implemented yet`);
    }

    return operationHandler(event, dynamodb);
};

function listCategoryRules(event, dynamodb) {
    //const clientId = event.requestContext.authorizer.claims.aud;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.queryStringParameters ? event.queryStringParameters.ruleType : undefined;

    return categoryRule.list(dynamodb, accountId, ruleType);
}

function createCategoryRule(event, dynamodb) {
    //const clientId = event.requestContext.authorizer.claims.aud;
    const accountId = event.pathParameters.accountId;
    const categoryRulesToAdd = JSON.parse(event.body);

    return categoryRule.create(dynamodb, accountId, categoryRulesToAdd);
}