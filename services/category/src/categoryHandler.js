const category = require('libs/category');
const { createVersionForCreatedItems, publishChangeSet } = require('libs/version');

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

const topLevelOperationMap = new Map([
    ['GET', listCategories ],
    ['POST', createCategory ]
]);

const categoryOperationMap = new Map([
    ['GET', getCategory ],
]);