const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { updateMetrics, recalculateMetrics } = require("../src/metricsUpdateHandler");
const testValues = require('./testValues');
const updateMetricsTestValues = require('./updateMetricsTestValues');
const recalculateMetricsTestValues = require('./recalculateMetricsValues');

const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateUpdateItemParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version");
};

const generateParamsValidator = (expectedParamsArr) => {
    return expectedParamsArr.map(expectedParams => {
        return params => {
            console.log("ACTUAL", JSON.stringify(params), "EXPECTED", JSON.stringify(expectedParams))
            expect(params).to.be.deep.equals(expectedParams);
        }
    });
}
describe('MetricsUpdateHandler unit tests', () => {
    describe('update metrics tests', () => {
        it('should update metrics for same day and same category', () => {
            const event = updateMetricsTestValues.sameDayAndCategoryUpdateEvent;

            const validateParams = generateParamsValidator(updateMetricsTestValues.sameDayAndCategoryUpdateQueryParams);
            const validators = validateParams.concat([validateUpdateItemParams]);
            const expectedDbResults = updateMetricsTestValues.sameDayAndCategoryUpdateResult.concat([testValues.versionUpdateResult]);
            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateMetricsTestValues.sameDayAndCategoryMetricUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateMetricsTestValues.sameDayAndCategoryMetricUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateMetricsTestValues.sameDayAndCategoryMetricUpdateVersionEvent.Detail);
            }
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = updateMetrics(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction value updated', () => {
            const event = updateMetricsTestValues.valueUpdateEvent;

            const validateParams = generateParamsValidator(updateMetricsTestValues.valueUpdateQueryParams);
            const validators = validateParams.concat([validateUpdateItemParams]);
            const expectedDbResults = updateMetricsTestValues.valueUpdateUpdateResult.concat([testValues.versionUpdateResult]);
            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateMetricsTestValues.valueUpdateUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateMetricsTestValues.valueUpdateUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateMetricsTestValues.valueUpdateUpdateVersionEvent.Detail);
            }
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = updateMetrics(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction category updated', () => {
            const event = updateMetricsTestValues.categoryUpdateEvent;

            const validateParams = generateParamsValidator(updateMetricsTestValues.categoryUpdateQueryParams);
            const validators = validateParams.concat([validateUpdateItemParams]);
            const expectedDbResults = updateMetricsTestValues.categoryUpdateResult.concat([testValues.versionUpdateResult]);
            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateMetricsTestValues.categoryUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateMetricsTestValues.categoryUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateMetricsTestValues.categoryUpdateVersionEvent.Detail);
            }
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = updateMetrics(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction category and value updated', () => {
            const event = updateMetricsTestValues.categoryAndValueUpdateEvent;

            const validateParams = generateParamsValidator(updateMetricsTestValues.categoryAndValueUpdateQueryParams);
            const validators = validateParams.concat([validateUpdateItemParams]);
            const expectedDbResults = updateMetricsTestValues.categoryAndValueUpdateResult.concat([testValues.versionUpdateResult]);
            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateMetricsTestValues.categoryAndValueUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateMetricsTestValues.categoryAndValueUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateMetricsTestValues.categoryAndValueUpdateVersionEvent.Detail);
            }
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = updateMetrics(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after multiple transactions categoryId has been updated', () => {
            const event = updateMetricsTestValues.multipleCategoriesUpdateEvent;

            const validateParams = generateParamsValidator(updateMetricsTestValues.multipleCategoriesUpdateQueryParams);
            const validators = validateParams.concat([validateUpdateItemParams]);
            const expectedDbResults = updateMetricsTestValues.multipleCategoriesUpdateResult.concat([testValues.versionUpdateResult]);
            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateMetricsTestValues.multipleCategoriesUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateMetricsTestValues.multipleCategoriesUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateMetricsTestValues.multipleCategoriesUpdateVersionEvent.Detail);
            }
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const promise = updateMetrics(event, dynamoDbMock, eventBridgeMock);

            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('recalculate metrics tests', () => {
        it('should update metrics', () => {
            const queryMetricsValidator = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#0001");
                expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
            };

            const deleteMetricsValidators = recalculateMetricsTestValues.retrieveMetricsResult.Items.map((item, index) => {
                return (params) => {
                    expect(params.Key.PK).to.be.deep.equals(item.PK, `Validating PK for item ${index}: ${item.PK}`);
                    expect(params.Key.SK).to.be.deep.equals(item.SK, `Validating SK for item ${index}: ${item.SK}`);
                }
            });

            const transactionQueryValidator = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#0000-00-00");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#9999-99-99");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const metricsUpdateValidators = recalculateMetricsTestValues.metricUpdateItemsResults.map((item, index) => {
                return (params) => {
                    expect(params.Item).to.be.deep.equals(item.Attributes, `Validating item ${index}`);
                }
            });

            const validators = [queryMetricsValidator]
                .concat(deleteMetricsValidators)
                .concat([transactionQueryValidator])
                .concat(metricsUpdateValidators);
            const results = [recalculateMetricsTestValues.retrieveMetricsResult]
                .concat(recalculateMetricsTestValues.deleteMetricsResults)
                .concat([recalculateMetricsTestValues.queryTransactionsResult])
                .concat(recalculateMetricsTestValues.metricUpdateItemsResults);

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = recalculateMetrics(dynamoDbMock, recalculateMetricsTestValues.recalculateMetricsEvent);

            return expect(promise).to.be.fulfilled;
        });
    });
});