const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const categoryRuleHandler = require('../src/categoryRuleHandler');

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

describe('CategoryRuleHandler unit tests', () => {
    describe('create category rule tests', () => {
        it('should create a single keyword category rule with success', () => {
            const expectedRuleType = "keyword";
            const expectedKeyword = "some_keyword";
            const expectedCategory = "03";

            const categoriesRulesToAdd = [{
                ruleType: expectedRuleType,
                keyword: expectedKeyword,
                categoryId: expectedCategory
            }];

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const event = {
                resource: "/account/{accountId}/categoryRule",
                httpMethod: "POST",
                pathParameters: { accountId: accountId },
                body: JSON.stringify(categoriesRulesToAdd),
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: clientId,
                        },
                    },
                },
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${accountId}`);
                expect(params.Item.SK.S).to.be.equal(`RULE#KEYWORD#${expectedKeyword}`);
                expect(params.Item.categoryId.S).to.be.equal(expectedCategory);
                expect(params.Item.keyword.S).to.be.equal(expectedKeyword);
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('putItem', expectedCreationParams);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);
            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should create a single expression category rule with success', () => {
            const expectedRuleType = "startsWith";
            const expectedParameter = "keyword";
            const expectedCategory = "02";
            const expectedRuleName = "Rule01"
            const expectedPriority = 1;


            const categoriesRulesToAdd = [{
                ruleType: expectedRuleType,
                parameter: expectedParameter,
                categoryId: expectedCategory,
                name: expectedRuleName,
                priority: expectedPriority
            }];

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const event = {
                resource: "/account/{accountId}/categoryRule",
                httpMethod: "POST",
                pathParameters: { accountId: accountId },
                body: JSON.stringify(categoriesRulesToAdd),
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: clientId,
                        },
                    },
                },
            };

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#EXPRESSION#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedQueryResult = {
                Count: 1,
                ScannedCount: 1
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${accountId}`);
                expect(params.Item.SK.S).to.be.equal("RULE#EXPRESSION#02");
                expect(params.Item.ruleId.S).to.be.equal("02");
                expect(params.Item.ruleType.S).to.be.equal(expectedRuleType);
                expect(params.Item.parameter.S).to.be.equal(expectedParameter);
                expect(params.Item.categoryId.S).to.be.equal(expectedCategory);
                expect(params.Item.name.S).to.be.equal(expectedRuleName);
                expect(params.Item.priority.N).to.be.equal(String(expectedPriority));
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('query', expectedQueryParams, expectedQueryResult)
                .setMock('putItem', expectedCreationParams);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should throw an error when creating a invalid expression rule type', () => {
            const expectedRuleType = "invalid";
            const expectedParameter = "keyword";
            const expectedCategory = "02";
            const expectedRuleName = "Rule01"
            const expectedPriority = 1;


            const categoriesRulesToAdd = [{
                ruleType: expectedRuleType,
                parameter: expectedParameter,
                categoryId: expectedCategory,
                name: expectedRuleName,
                priority: expectedPriority
            }];

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const event = {
                resource: "/account/{accountId}/categoryRule",
                httpMethod: "POST",
                pathParameters: { accountId: accountId },
                body: JSON.stringify(categoriesRulesToAdd),
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: clientId,
                        },
                    },
                },
            };

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#EXPRESSION#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedQueryResult = {
                Count: 1,
                ScannedCount: 1
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('query', expectedQueryParams, expectedQueryResult);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);

            return expect(promise).to.eventually.be.rejectedWith(Error, `Invalid rule type: [invalid]`);
        });
    });

    describe('list category rules test', () => {
        it('should list all categories rules from an account', () => {

            const clientId = "10v21l6b17g3t27sfbe38b0i8n";
            const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

            const event = {
                resource: "/account/{accountId}/categoryRule",
                httpMethod: "GET",
                pathParameters: { accountId: accountId },
                body: null,
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: clientId,
                        },
                    },
                },
            };

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedResult = {
                Count: 2,
                Items: [
                    {
                        PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
                        SK: {"S": "RULE#KEYWORD#Some_Keyword"},
                        accountId: {"S": accountId},
                        keyword:  {"S": "Some_Keyword"},
                        categoryId:  {"S": "01"},
                        name: {"S": "Category Name"},
                    },
                    {
                        PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
                        SK: {"S": "RULE#EXPRESSION#01"},
                        accountId: {"S": accountId},
                        ruleId:  {"S": "01"},
                        ruleType:  {"S": "startsWith"},
                        parameter:  {"S": "aword"},
                        name:  {"S": "Rule01"},
                        priority: {"N": "10"},
                        categoryId:  {"S": "02"}
                    }
                ],
                ScannedCount: 2
            };

            const dynamoDbMock = new DynamoDbMock().setMock('query', validateParams, expectedResult);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);

            const expectedRule = {
                accountId: accountId,
                ruleId: "01",
                ruleType: "startsWith",
                parameter: "aword",
                name: "Rule01",
                priority: "10",
                categoryId: "02"
            };

            return expect(promise).to.eventually.deep.include(expectedRule);
        });
    });
});