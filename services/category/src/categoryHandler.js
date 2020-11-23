const category = require('libs/category');
const { createVersionForCreatedItems, createVersionForUpdatedItems, publishChangeSet } = require('libs/version');

exports.handle = async (event, dynamodb, eventbridge) => {
    // FIX ME change for a utility function
    const accountId = event.pathParameters ? event.pathParameters.accountId : undefined;
    const categoryId = event.pathParameters ? event.pathParameters.categoryId : undefined;
    
    const operationMap = accountId && categoryId ? categoryOperationMap : topLevelOperationMap;
    const operationHandler = operationMap.get(event.httpMethod);

    if(!operationHandler) {
        throw new Error(`Method ${event.httpMethod} for resource ${event.resource} not implemented yet`);
    }

    return await operationHandler(event, dynamodb, eventbridge);
};

const listCategories = (event, dynamodb) => {
    const accountId = event.pathParameters.accountId;

    return category.list(dynamodb, accountId);
}

const createCategory = async (event, dynamodb, eventbridge) => {
    const accountId = event.pathParameters.accountId;
    const categoriesToAdd = JSON.parse(event.body);

    const createCategoryResults = await category.create(dynamodb, accountId, categoriesToAdd);

    const changeSet = await createVersionForCreatedItems({dynamodb, accountId, results: createCategoryResults});

    if(changeSet) {
        await publishChangeSet(eventbridge, changeSet);
    }

    return createCategoryResults;
}

const getCategory = (event, dynamodb) => {
    const accountId = event.pathParameters.accountId;
    const categoryId = event.pathParameters.categoryId;

    const cat = new category.Category(accountId, categoryId);

    return cat.load(dynamodb);
}

const updateCategory = async (event, dynamodb, eventbridge) => {
    const accountId = event.pathParameters.accountId;
    const categoryId = event.pathParameters.categoryId;

    if(!accountId || !categoryId || categoryId === "") {
        throw new Error("Invalid path parameters");
    }

    const changeSet = JSON.parse(event.body);
    const oldAttributes = changeSet.old;
    const attributesToUpdate = changeSet.new;

    if(!oldAttributes || !attributesToUpdate) {
        throw new Error("Event body invalid for Category update");
    }

    console.log("Updating category [", categoryId, "] attributes from", oldAttributes, "to", attributesToUpdate);
    const categoryToUpdate = new category.Category(accountId, categoryId);

    for(let attribute in oldAttributes) {
        if(categoryToUpdate.hasOwnProperty(attribute) 
            && (oldAttributes[attribute] === null || typeof(categoryToUpdate[attribute]) === typeof(oldAttributes[attribute]))) {
            categoryToUpdate[attribute] = oldAttributes[attribute];
        } else {
            throw new Error(`Old attribute '${attribute}' is not a valid Category attribute`);
        }
    }

    // Check if some update attribute doesn't have the old value
    for(let updatedAttribute in attributesToUpdate) {
        if(!oldAttributes.hasOwnProperty(updatedAttribute)) {
            throw new Error(`Missing old value for attribute '${updatedAttribute}'`);
        }

        if(!categoryToUpdate.hasOwnProperty(updatedAttribute)
            || typeof(categoryToUpdate[updatedAttribute]) !== typeof(attributesToUpdate[updatedAttribute])) {
            throw new Error(`New attribute '${updatedAttribute}' is not a valid Category attribute`);
        }
    }

    const updateCategoryRuleResult = await category.update(dynamodb, categoryToUpdate, attributesToUpdate);

    const versionedChangeSet = await createVersionForUpdatedItems({dynamodb, accountId, results: [updateCategoryRuleResult]});

    if(versionedChangeSet) {
        await publishChangeSet(eventbridge, versionedChangeSet);
    }

    return updateCategoryRuleResult;
}

const topLevelOperationMap = new Map([
    ['GET', listCategories ],
    ['POST', createCategory ]
]);

const categoryOperationMap = new Map([
    ['GET', getCategory ],
    ['PUT', updateCategory ],
]);