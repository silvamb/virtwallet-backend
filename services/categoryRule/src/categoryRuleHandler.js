const categoryRule = require('libs/categoryRule');

exports.handle = async (event, dynamodb) => {
    const operationMap = new Map([
        ['GET', listCategoryRules ],
        ['POST', createCategoryRule ],
        ['PUT', updateCategoryRule],
        ['DELETE', deleteCategoryRule],
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

function updateCategoryRule(event, dynamodb) {
    //const clientId = event.requestContext.authorizer.claims.aud;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.pathParameters.ruleType;
    const ruleId = event.pathParameters.ruleId;

    if(!accountId || !ruleType || !ruleId) {
        throw new Error("Missing path parameters");
    }

    const changeSet = JSON.parse(event.body);
    const oldAttributes = changeSet.old;
    const updatedAttributes = changeSet.new;

    if(!oldAttributes || !updatedAttributes) {
        throw new Error("Event body invalid for CategoryRule update");
    }

    console.log("Updating category rule [", ruleId, "] attributes from", oldAttributes, "to", updatedAttributes);
    const ruleToUpdate = categoryRule.createRule(accountId, ruleType, ruleId, oldAttributes);

    for(let attribute in oldAttributes) {
        if(ruleToUpdate.hasOwnProperty(attribute)
            && typeof(ruleToUpdate[attribute]) == typeof(oldAttributes[attribute])) {
            ruleToUpdate[attribute] = oldAttributes[attribute];
        } else {
            throw new Error(`Old attribute '${attribute}' is not a valid CategoryRule attribute`);
        }
    }

    // Check if some update attribute doesn't have the old value
    for(let updatedAttribute in updatedAttributes) {
        if(!oldAttributes.hasOwnProperty(updatedAttribute)) {
            throw new Error(`Missing old value for attribute '${updatedAttribute}'`);
        }
    }

    return categoryRule.update(dynamodb, ruleToUpdate, updatedAttributes);
}

function deleteCategoryRule(event, dynamodb) {
    //const clientId = event.requestContext.authorizer.claims.aud;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.pathParameters.ruleType;
    const ruleId = event.pathParameters.ruleId;

    if(!accountId || !ruleType || !ruleId) {
        throw new Error("Missing path parameters");
    }

    const rule = categoryRule.createRule(accountId, ruleType, ruleId);

    console.log("Deleting Category Rule", rule);
    return categoryRule.delete(dynamodb, rule);
}