const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb; 
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["categoryId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType],
    ["version", dynamodb.NumberAttributeType]
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
        this.version = 1;
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

    getType() {
        return "Category";
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

        if(queryData.Count === 0) {
            throw new Error(`Category with id ${this.categoryId} not found`);
        }

        return fromItem(queryData.Items[0], this);
    }
}

class CategoryList {
    constructor(dynamodb) {
        this.dynamodb = dynamodb;
        this.categories = [];
    }

    async load(accountId) {
        console.log(`Loading categories for account ${accountId}`);
        this.categories = await exports.list(this.dynamodb, accountId);

        return this.categories;
    }

    getCategory(categoryId) {
        return this.categories.find(category => category.categoryId === categoryId)
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


    console.log(`Persisting ${categories.length} new categories in DynamoDb`);
    const putItemsResult = await dbClient.putItems(categories, false);

    return putItemsResult.map((result, index) => {
        if(result.success) {
            return {
                data: categories[index]
            }
        } else {
            return {
                err: result.data
            }
        }
    });
}

/**
 * Lists all categories created for the provided account.
 * 
 * @param {AWS.DynamoDB} dynamodb Dynamo DB client library
 * @param {string} accountId account ID
 * @returns {Promise<Array<Category>>} a list with the categories
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
exports.CategoryList = CategoryList;