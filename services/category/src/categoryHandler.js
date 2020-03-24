const category = require('libs/category');
const Category = category.Category;
const DynamoDb = require('libs/dynamodb').DynamoDb;
const fromItem = require('libs/dynamodb').fromItem;
const getPK = category.getPK;
const getSK = category.getSK;

class CategoryHandler {

    constructor(dynamodb) {
        console.log("Creating Category Handler");
        this.dynamodb = new DynamoDb(dynamodb);
    }

    async create(clientId, accountId, categoriesToAdd) {
        // TODO validate if user is a member of this account

        const pk = getPK(accountId);
        const skPrefix = getSK();
        console.log(`Creating new categories for user ${clientId} and account ${accountId}.`);

        const nextCategoryId = await this.dynamodb.getNext(pk, skPrefix);
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
            const item = await this.dynamodb.putItem(categories[0]);

            console.log("Put item returned", item);

            retVal = item;
        } else {
            console.log(`Persisting ${categories.length} new categories in DynamoDb`);
            retVal = await this.dynamodb.putItems(categories);
        }

        return retVal;
    }

    async list(_clientId, accountId) {
        // TODO validate if user is a member of this account
        console.log(`Listing categories for account [${accountId}]`);

        const pk = getPK(accountId);

        const queryData = await this.dynamodb.queryAll(pk);

        const categories = queryData.Items.map((item) => {
            return fromItem(item, new Category());
        });

        console.log(`Categories retrieved for account [${accountId}]: ${categories.length}`);
        console.log(categories);

        return categories;
    }

    async get(accountId, categoryId) {
        // TODO validate if user is a member of this account

        const pk = getPK(accountId);
        const sk = getSK(categoryId);

        const queryData = await this.dynamodb.queryAll(pk, sk);
        const category = fromItem(queryData.Items[0], new Category());

        return category;
    }

    async update(_category) {
        throw new Error("Operation CategoryHandler.update not implemented yet");
    }

    async delete(_accountId, _categoryId) {
        throw new Error("Operation CategoryHandler.delete not implemented yet");
    }
}

exports.CategoryHandler = CategoryHandler;