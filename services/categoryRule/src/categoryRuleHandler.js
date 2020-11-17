const categoryRule = require('libs/categoryRule');
const { createVersionForCreatedItems, createVersionForDeletedItems, createVersionForUpdatedItems, publishChangeSet } = require('libs/version');

exports.handle = async (event, dynamodb, eventbridge) => {
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

    return operationHandler(event, dynamodb, eventbridge);
};

async function listCategoryRules(event, dynamodb) {
    //const clientId = event.requestContext.authorizer.claims.sub;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.queryStringParameters ? event.queryStringParameters.ruleType : undefined;

    return categoryRule.list(dynamodb, accountId, ruleType);
}

async function createCategoryRule(event, dynamodb, eventbridge) {
    //const clientId = event.requestContext.authorizer.claims.sub;
    const accountId = event.pathParameters.accountId;
    const categoryRulesToAdd = JSON.parse(event.body);

    if(!accountId) {
        throw new Error("Missing accountId");
    }

    const createCategoryRulesResult = await categoryRule.create(dynamodb, accountId, categoryRulesToAdd);

    const changeSet = await createVersionForCreatedItems({dynamodb, accountId, results: createCategoryRulesResult});

    if(changeSet) {
        await publishChangeSet(eventbridge, changeSet);
    }

    return createCategoryRulesResult;
}

async function updateCategoryRule(event, dynamodb, eventbridge) {
    //const clientId = event.requestContext.authorizer.claims.sub;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.pathParameters.ruleType;
    const ruleId =  decodeURIComponent(event.pathParameters.ruleId);

    if(!accountId || !ruleType || !ruleId) {
        throw new Error("Missing path parameters");
    }

    if(ruleId === "") {
        throw new Error("Rule ID cannot be empty");
    }

    const changeSet = JSON.parse(event.body);
    const oldAttributes = changeSet.old;
    const updatedAttributes = changeSet.new;

    if(!oldAttributes || !updatedAttributes) {
        throw new Error("Event body invalid for CategoryRule update");
    }

    console.log("Updating category rule [", ruleId, "] attributes from", oldAttributes, "to", updatedAttributes);
    const ruleToUpdate = categoryRule.toCategoryRule(accountId, ruleType, ruleId, oldAttributes);

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

    const updateCategoryRuleResult = await categoryRule.update(dynamodb, ruleToUpdate, updatedAttributes);

    const versionedChangeSet = await createVersionForUpdatedItems({dynamodb, accountId, results: [updateCategoryRuleResult]});

    if(versionedChangeSet) {
        await publishChangeSet(eventbridge, versionedChangeSet);
    }

    return updateCategoryRuleResult;
}

async function deleteCategoryRule(event, dynamodb, eventbridge) {
    //const clientId = event.requestContext.authorizer.claims.sub;
    const accountId = event.pathParameters.accountId;
    const ruleType = event.pathParameters.ruleType;
    const ruleId =  decodeURIComponent(event.pathParameters.ruleId);

    if(!accountId || !ruleType || !ruleId) {
        throw new Error("Missing path parameters");
    }

    const rule = categoryRule.toCategoryRule(accountId, ruleType, ruleId);

    console.log("Deleting Category Rule", rule);
    const deleteCategoryRuleResult = await categoryRule.remove(dynamodb, rule);

    const changeSet = await createVersionForDeletedItems({dynamodb, accountId, results: [deleteCategoryRuleResult]});

    if(changeSet) {
        await publishChangeSet(eventbridge, changeSet);
    }

    return deleteCategoryRuleResult;
}