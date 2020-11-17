const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const testValues = require('./testValues');
const categoryRuleHandler = require('../src/categoryRuleHandler');
const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateUpdateItemParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.accountId}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
};

describe('CategoryRuleHandler unit tests', () => {
    describe('create category rule tests', () => {
        it('should create a single keyword category rule with success', () => {
            const event = testValues.createKeywordRuleEvent;

            const expectedCreationParams = (params) => {
                expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${testValues.accountId}`);
                expect(params.Item.SK.S).to.be.equal(`RULE#KEYWORD#${testValues.expectedKeyword}`);
                expect(params.Item.categoryId.S).to.be.equal(testValues.expectedKeywordCategory);
                expect(params.Item.keyword.S).to.be.equal(testValues.expectedKeyword);
            };

            const validators = [expectedCreationParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.putItemResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedNewKeywordVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedNewKeywordVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedNewKeywordVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams, validateUpdateItemParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);
            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should create a single expression category rule with success', () => {
            const event = testValues.createValidExpressionRuleEvent;

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#EXPRESSION#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${testValues.accountId}`);
                expect(params.Item.SK.S).to.be.equal("RULE#EXPRESSION#02");
                expect(params.Item.ruleId.S).to.be.equal("02");
                expect(params.Item.ruleType.S).to.be.equal(testValues.expectedRuleType);
                expect(params.Item.parameter.S).to.be.equal(testValues.expectedParameter);
                expect(params.Item.categoryId.S).to.be.equal(testValues.expectedExpressionCategory);
                expect(params.Item.name.S).to.be.equal(testValues.expectedRuleName);
                expect(params.Item.priority.N).to.be.equal(String(testValues.expectedPriority));
            };

            const validators = [expectedQueryParams, expectedCreationParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.countQueryResult,
                testValues.putItemResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedNewExprRuleVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedNewExprRuleVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedNewExprRuleVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should throw an error when creating a invalid expression rule type', () => {
            const event = testValues.createInvalidExpressionRuleEvent;

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#EXPRESSION#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const dynamoDbMock = new DynamoDbMock([expectedQueryParams], [testValues.countQueryResult]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);

            return expect(promise).to.eventually.be.rejectedWith(Error, `Invalid rule type: [invalid]`);
        });
    });

    describe('list category rules test', () => {
        it('should list all categories rules from an account', () => {
            const event = testValues.listCategoryRulesEvent;

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const dynamoDbMock = new DynamoDbMock([validateParams], [testValues.categoryRules]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock);

            return expect(promise).to.eventually.become(testValues.expectedRules);
        });
    });

    describe('update category rule test', () => {
        it('should update an expression category rule', () => {
            const event = testValues.updateExpressionRuleEvent;

            const validateParams = params => {
                expect(params).to.be.deep.equals(testValues.updateExpressionRuleParams);
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.expressionRuleUpdateResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateExprRuleVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateExprRuleVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateExprRuleVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update a keyword category rule', () => {
            const event = testValues.updateExpressionRuleEvent;

            const validateParams = params => {
                expect(params).to.be.deep.equals(testValues.updateKeywordRuleEvent);
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.keywordRuleUpdateResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateKeywordVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateKeywordVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateKeywordVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should fail when trying to update a keyword category rule', () => {
            const event = testValues.invalidUpdateKeywordRuleEvent;

            const promise = categoryRuleHandler.handle(event, new DynamoDbMock());

            return expect(promise).to.eventually.be.rejectedWith(Error, "CategoryRule attribute 'keyword' is not updatable");
        });
    });

    describe('delete category rule test', () => {
        it('should delete an expression category rule', () => {
            const event = testValues.deleteExpressionRuleEvent;

            const validateParams = params => {
                expect(params).to.be.deep.equals(testValues.deleteExpressionRuleParams);
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.deleteRuleResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedDeleteExprRuleVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedDeleteExprRuleVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedDeleteExprRuleVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should delete a keyword category rule', () => {
            const event = testValues.deleteKeywordRuleEvent;

            const validateParams = params => {
                expect(params).to.be.deep.equals(testValues.deleteKeywordRuleParams);
            }

            const validators = [validateParams, validateUpdateItemParams];

            const expectedDbResults = [
                testValues.deleteRuleResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedDeleteKeywordVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedDeleteKeywordVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedDeleteKeywordVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = categoryRuleHandler.handle(event, dynamoDbMock, eventBridgeMock);
            return expect(promise).to.eventually.be.fulfilled;
        });
    });
});