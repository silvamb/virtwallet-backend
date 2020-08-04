const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb; 
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["categoryId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType]
]);

const getPK = (accountId) => `ACCOUNT#${accountId}`;
const getSK = (categoryId) => {
    let sk = `CATEGORY#`;
    
    if(categoryId) {
        sk = sk.concat(categoryId);
    }

    return sk;
}

/**
 * Transaction Category
 */
class Category {

    constructor(accountId = "", categoryId = "") {
        this.accountId = accountId;
        this.categoryId = categoryId;
        this.name = "";
        this.description = "";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.categoryId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }

    /**
     * Loads data from this category from the database. Any existing attribute is overwritten.
     * 
     * @param {AWS.DynamoDB} dynamodb DynamoDB client library
     */
    async load(dynamodb) {
        const dbClient = new DynamoDb(dynamodb);

        const pk = getPK(this.accountId);
        const sk = getSK(this.categoryId);

        const queryData = await dbClient.queryAll(pk, sk);

        if(queryData.Items.length == 0) {
            throw new Error(`Category with id ${this.categoryId} not found`);
        }

        return fromItem(queryData.Items[0], this);
    }
}

/**
 * Creates the provided categories and persists them.
 * 
 * @param {AWS.DynamoDB} dynamodb Dynamo DB client library
 * @param {string} accountId account ID
 * @param {Array<any>} categoriesToAdd categories to add
 */
exports.create = async(dynamodb, accountId, categoriesToAdd) =>  {
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);
    const skPrefix = getSK();
    console.log(`Creating new categories for user account ${accountId}.`);

    const nextCategoryId = await dbClient.getNext(pk, skPrefix);
    console.log(`Categories id starting at ${nextCategoryId}.`);

    const categories = categoriesToAdd.map((categoryDetails, index) => {
        const category = new Category();
        category.accountId = accountId;
        category.categoryId = String(nextCategoryId + index).padStart(2, '0');
        category.name = categoryDetails.name;
        category.description = categoryDetails.description;

        return category;
    });

    let retVal;

    if (categories.length == 1) {
        console.log(`Persisting new category in DynamoDb: [${JSON.stringify(categories[0])}]`);
        const item = await dbClient.putItem(categories[0]);

        console.log("Put item returned", item);

        retVal = item;
    } else {
        console.log(`Persisting ${categories.length} new categories in DynamoDb`);
        retVal = await dbClient.putItems(categories);
    }

    return retVal;
}

/**
 * Lists all categories created for the provided account.
 * 
 * @param {AWS.DynamoDB} dynamodb Dynamo DB client library
 * @param {string} accountId account ID
 * @returns {Array<Category>} a list with the categories
 */
exports.list = async(dynamodb, accountId) => {
    console.log(`Listing categories for account [${accountId}]`);

    const dbClient = new DynamoDb(dynamodb);
    const pk = getPK(accountId);
    const sk = getSK();

    const queryBuilder = new QueryBuilder(pk).sk.beginsWith(sk);
    const queryData = await dbClient.query(queryBuilder.build());

    const categories = queryData.Items.map((item) => {
        return fromItem(item, new Category());
    });

    console.log(`Categories retrieved for account [${accountId}]:`, categories);

    return categories;
}

exports.Category = Category;