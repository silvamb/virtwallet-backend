const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { createVersionForDeletedItems } = require("libs/version");
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

const validateUpdateItemParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version");
};

describe("CategoryHandler unit tests", () => {
    describe("create category tests", () => {
        it("should create a single category with success", () => {

            const validatePutItemParams = (params) => {
                expect(params.Item.categoryId.S).to.be.equal("01");
                expect(params.Item.accountId.S).to.be.equal(testValues.ACCOUNT_ID);
                expect(params.Item.name.S).to.be.equal("Category Name");
                expect(params.Item.description.S).to.be.equal("Category Description");
                expect(params.Item.budget.S).to.be.equal(JSON.stringify([1,{
                    type: "MONTHLY",
                    value: 250,
                    versionId: 1
                }]));
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

            return expect(promise).to.eventually.be.deep.equals(testValues.expectedSingleCategoryResult);
        });

        it("should create 2 categories with success", () => {

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

            return expect(promise).to.eventually.be.deep.equals(testValues.expectedMultipleCategoryResult);
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

    describe("update category test", () => {
        it("should update a category name and description", () => {
            const event = testValues.updateCategoryNameEvent;

            const validateParams = params => {
                expect(params.Key.PK.S).to.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Key.SK.S).to.equals("CATEGORY#05");
                expect(params.ExpressionAttributeNames["#name"]).to.be.equals("name");
                expect(params.ExpressionAttributeNames["#description"]).to.be.equals("description");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":name"].S).to.be.equals("newName");
                expect(params.ExpressionAttributeValues[":description"].S).to.be.equals("newDesc");
                expect(params.ExpressionAttributeValues[":old_name"].S).to.be.equals("oldName");
                expect(params.ExpressionAttributeValues[":old_description"].S).to.be.equals("oldDesc");
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #name = :name,#description = :description");
                expect(params.ConditionExpression).to.be.equals("#name = :old_name AND #description = :old_description");
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.expressionCategoryNameUpdateResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdatedCategoryNameEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdatedCategoryNameEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdatedCategoryNameEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.haveOwnProperty('data');
        });

        it("should update a category budget", () => {
            const event = testValues.updateCategoryBudgetEvent;

            const validateParams = params => {
                expect(params.Key.PK.S).to.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Key.SK.S).to.equals("CATEGORY#06");
                expect(params.ExpressionAttributeNames["#budget"]).to.be.equals("budget");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":budget"].S).to.be.equals(JSON.stringify([1,testValues.updateCategoryBudgetEventBody.new.budget]));
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #budget = :budget");
                expect(params.ConditionExpression).to.be.equals("attribute_not_exists(#budget)");
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.expressionCategoryBudgetUpdateResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdatedCategoryBudgetEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdatedCategoryBudgetEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdatedCategoryBudgetEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.haveOwnProperty('data');
        });
    });
});