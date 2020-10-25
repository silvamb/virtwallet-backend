const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const categoryHandler = require("../src/categoryHandler");
const testValues = require('./testValues');
const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateCategoryQueryParams = (params) => {
    expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("CATEGORY#");
    expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
};

describe("CategoryHandler unit tests", () => {
    describe("create category tests", () => {
        it("should create a single category with success", () => {

            const validatePutItemParams = (params) => {
                expect(params.Item.categoryId.S).to.be.equal("01");
                expect(params.Item.accountId.S).to.be.equal(testValues.ACCOUNT_ID);
                expect(params.Item.name.S).to.be.equal("Category Name");
                expect(params.Item.description.S).to.be.equal("Category Description");
            };

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedVersionEvent.Detail);
            }

            const validators = [validateCategoryQueryParams, validatePutItemParams, validateUpdateItemParams];
            const results = [testValues.emptyQueryResult, testValues.putItemResult, testValues.versionUpdateResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams], [testValues.expectedPutEventResult]);

            const promise = categoryHandler.handle(testValues.createCategoryEvent, dynamoDbMock, eventBridgeMock);

            const expectedResult = [{
                success: true,
                data: testValues.putItemResult
            }];
            return expect(promise).to.eventually.be.deep.equals(expectedResult);
        });

        it("should create 2 categories with success", () => {
            const validateUpdateItemParams = (params) => {
                expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Key.SK.S).to.be.equal("METADATA");
                expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
                expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
            };

            const validatePutItem01Params = (params) => {
                expect(params.Item.categoryId.S).to.be.equal("01");
                expect(params.Item.accountId.S).to.be.equal(testValues.ACCOUNT_ID);
                expect(params.Item.name.S).to.be.equal("Category 1 Name");
                expect(params.Item.description.S).to.be.equal("Category 1 Description");
            };

            const validatePutItem02Params = (params) => {
                expect(params.Item.categoryId.S).to.be.equal("02");
                expect(params.Item.accountId.S).to.be.equal(testValues.ACCOUNT_ID);
                expect(params.Item.name.S).to.be.equal("Category 2 Name");
                expect(params.Item.description.S).to.be.equal("Category 2 Description");
            };

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedVersionEventMultipleCat.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedVersionEventMultipleCat.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedVersionEventMultipleCat.Detail);
            }

            const validators = [validateCategoryQueryParams, validatePutItem01Params, validatePutItem02Params, validateUpdateItemParams];
            const results = [testValues.emptyQueryResult, testValues.putItemResult, testValues.putItemResult, testValues.versionUpdateResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams], [testValues.expectedPutEventResult]);

            const promise = categoryHandler.handle(testValues.createTwoCategoriesEvent, dynamoDbMock, eventBridgeMock);

            const expectedResult = Array(2).fill({
                success: true,
                data: testValues.putItemResult
            });

            return expect(promise).to.eventually.be.deep.equals(expectedResult);
        });
    });

    describe("list categories test", () => {
        it("should list categories from an user", () => {

            const validateQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("CATEGORY#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const validators = [validateQueryParams];
            const results = [testValues.queryResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = categoryHandler.handle(testValues.listCategoriesEvent, dynamoDbMock);

            return expect(promise).to.eventually.be.deep.equals(testValues.expectedList);
        });
    });

    describe("get category test", () => {
        it("should get an category from an user and account", () => {
            const validateQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal(
                    `ACCOUNT#${testValues.ACCOUNT_ID}`
                );
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal(
                    `CATEGORY#${testValues.CATEGORY_ID}`
                );
                expect(params.KeyConditionExpression).to.be.equal(
                    "PK = :pk AND SK =:sk"
                );
            };

            const validators = [validateQueryParams];
            const results = [testValues.queryResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = categoryHandler.handle(testValues.getCategoryEvent, dynamoDbMock);

            return expect(promise).to.eventually.become(testValues.expectedList[0]);
        });

        it("should return error when category id not found", () => {

            const validateQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal(
                    `ACCOUNT#${testValues.ACCOUNT_ID}`
                );
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal(
                    `CATEGORY#${testValues.CATEGORY_ID}`
                );
                expect(params.KeyConditionExpression).to.be.equal(
                    "PK = :pk AND SK =:sk"
                );
            };

            const validators = [validateQueryParams];
            const results = [testValues.emptyQueryResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = categoryHandler.handle(testValues.getCategoryEvent, dynamoDbMock);

            return expect(promise).to.eventually.be.rejectedWith(Error, `Category with id ${testValues.CATEGORY_ID} not found`);
        });
    });
});