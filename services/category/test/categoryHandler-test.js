const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const CategoryHandler = require('../src/categoryHandler').CategoryHandler;

// Add to a test lib
class DynamoDbMock  {

    setMock(functionName, validateFunction = () => true, expectedResult = {ConsumedCapacity: 1}) {

        this[functionName] = (params) => {
            validateFunction(params);

            return {
                promise: () => {
                    return Promise.resolve(expectedResult);
                }
            }
        }

        return this;
    }

};

describe('CategoryHandler unit tests', () => {
    describe('create category tests', () => {
        it('should create a single category with success', () => {

            const expectedCategoryName = "Category Name";
            const expectedCategoryDesc = "Category Description";

            const categoriesToAdd = [{
                name: expectedCategoryName,
                description: expectedCategoryDesc
            }];

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("CATEGORY#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedQueryResult = {
                Count: 0,
                ScannedCount: 0
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.categoryId.S).to.be.equal("01");
                expect(params.Item.accountId.S).to.be.equal(accountId);
                expect(params.Item.name.S).to.be.equal(expectedCategoryName);
                expect(params.Item.description.S).to.be.equal(expectedCategoryDesc);
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('query', expectedQueryParams, expectedQueryResult)
                .setMock('putItem', expectedCreationParams);

            const categoryHandler = new CategoryHandler(dynamoDbMock);
            const promise = categoryHandler.create(clientId, accountId, categoriesToAdd);
            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should create 2 categories with success', () => {

            const expectedCategoryName = "Category Name";
            const expectedCategoryDesc = "Category Description";

            const categoriesToAdd = [
                {
                    name: expectedCategoryName,
                    description: expectedCategoryDesc
                },
                {
                    name: expectedCategoryName,
                    description: expectedCategoryDesc
                }
            ];

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("CATEGORY#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedQueryResult = {
                Count: 0,
                ScannedCount: 0
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.categoryId.S).to.be.oneOf(["01", "02"]);
                expect(params.Item.accountId.S).to.be.equal(accountId);
                expect(params.Item.name.S).to.be.equal(expectedCategoryName);
                expect(params.Item.description.S).to.be.equal(expectedCategoryDesc);
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('query', expectedQueryParams, expectedQueryResult)
                .setMock('putItem', expectedCreationParams, {ConsumedCapacity: 2});

            const categoryHandler = new CategoryHandler(dynamoDbMock);
            const promise = categoryHandler.create(clientId, accountId, categoriesToAdd);
            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('list categories test', () => {
        it('should list categories from an user', () => {

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk");
            };

            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
                        SK: {"S": "CATEGORY#01"},
                        accountId:  {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
                        categoryId:  {"S": "01"},
                        name: {"S": "Category Name"},
                        description: {"S": "Category Description"}
                    }
                ],
                ScannedCount: 1
            };

            const dynamoDbMock = new DynamoDbMock().setMock('query', validateParams, expectedResult);

            const categoryHandler = new CategoryHandler(dynamoDbMock);
            const promise = categoryHandler.list(clientId, accountId);

            const expectedList = {
                accountId: accountId,
                categoryId: "01",
                name: "Category Name",
                description: "Category Description"
            };

            return expect(promise).to.eventually.deep.include(expectedList);
        });
    });

    describe('get category test', () => {
        it('should get an category from an user and account', () => {
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";
            const categoryId = "05";

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal(`ACCOUNT#${accountId}`);
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal(`CATEGORY#${categoryId}`);
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK =:sk");
            };

            // TODO Add this to a JSON file
            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: {"S": `ACCOUNT#${accountId}`},
                        SK: {"S": `CATEGORY#${categoryId}`},
                        accountId:  {"S": accountId},
                        categoryId:  {"S": categoryId},
                        name: {"S": "Category Name"},
                        description: {"S": "Category Description"}
                    }
                ],
                ScannedCount: 1
            };

            const dynamoDbMock = new DynamoDbMock().setMock('query', validateParams, expectedResult);

            const categoryHandler = new CategoryHandler(dynamoDbMock);
            const promise = categoryHandler.get(accountId, categoryId);

            // TODO Add this to a JSON file
            const expectedCategory = {
                accountId: accountId,
                categoryId: categoryId,
                name: "Category Name",
                description: "Category Description"
            };

            return expect(promise).to.eventually.become(expectedCategory);
        });
    });
});