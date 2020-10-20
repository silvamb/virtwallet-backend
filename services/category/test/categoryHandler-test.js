const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const categoryHandler = require("../src/categoryHandler");
const testValues = require('./testValues');
const DynamoDbMock = testValues.DynamoDbMock;

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

            const validators = [validateCategoryQueryParams, validatePutItemParams];
            const results = [testValues.emptyQueryResult, testValues.putItemResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = categoryHandler.handle(testValues.createCategoryEvent, dynamoDbMock);

            const expectedResult = {
                success: true,
                data: testValues.putItemResult
            };
            return expect(promise).to.eventually.be.deep.equals(expectedResult);
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

            const validators = [validateCategoryQueryParams, validatePutItem01Params, validatePutItem02Params];
            const results = [testValues.emptyQueryResult, testValues.putItemResult, testValues.putItemResult];

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = categoryHandler.handle(testValues.createTwoCategoriesEvent, dynamoDbMock);

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