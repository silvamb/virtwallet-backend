const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { updateMetrics, recalculateMetrics } = require("../src/metricsUpdateHandler");
const testValues = require('./testValues');

const DynamoDbMock = testValues.DynamoDbMock;

const expectedUpdateResults = [
    {
        PK: {
            S: "ACCOUNT#"+exports.ACCOUNT_ID,
        },
        SK: { S: "METRIC#0001#D#2020-01-01#01" },
        count: {
            N: "1",
        },
        sum: { N: "3.5" }
    }
];

describe('MetricsUpdateHandler unit tests', () => {
    describe('update metrics tests', () => {
        it('should update metrics for same day and same category', () => {

            const event = testValues.sameDayAndCategoryUpdateEvent;
            const dbRangeKeys = [
                "METRIC#0001#Y#2020#01",
                "METRIC#0001#M#2020-02#01",
                "METRIC#0001#D#2020-02-01#01"
            ];

            const validateParams = params => {
                expect(params.Key.SK.S).to.be.oneOf(dbRangeKeys)
                expect(params.ExpressionAttributeNames["#count"]).to.be.equals("count");
                expect(params.ExpressionAttributeNames["#sum"]).to.be.equals("sum");
                expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("9");
                expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("2");
                expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
            }

            const dynamoDbMock = new DynamoDbMock([validateParams], expectedUpdateResults);

            const promise = updateMetrics(dynamoDbMock, event);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction value updated', () => {
            const validateParams = params => {
                expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat01)
                expect(params.ExpressionAttributeNames["#count"]).to.be.equals("count");
                expect(params.ExpressionAttributeNames["#sum"]).to.be.equals("sum");
                expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("3");
                expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("0");
                expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
            }

            const dynamoDbMock = new DynamoDbMock([validateParams], expectedUpdateResults);

            const promise = updateMetrics(dynamoDbMock, testValues.valueUpdateEvent);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction category updated', () => {

            const validateParams = params => {
                expect(params.ExpressionAttributeNames["#count"]).to.be.equals("count");
                expect(params.ExpressionAttributeNames["#sum"]).to.be.equals("sum");

                if(params.Key.SK.S.endsWith("#01")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat01)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("-2");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("-1");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }

                if(params.Key.SK.S.endsWith("#02")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat02)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("2");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("1");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }
            }

            const dynamoDbMock = new DynamoDbMock([validateParams], expectedUpdateResults);

            const promise = updateMetrics(dynamoDbMock, testValues.categoryUpdateEvent);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after transaction category and value updated', () => {

            const validateParams = params => {
                expect(params.ExpressionAttributeNames["#count"]).to.be.equals("count");
                expect(params.ExpressionAttributeNames["#sum"]).to.be.equals("sum");

                if(params.Key.SK.S.endsWith("#01")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat01)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("-2");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("-1");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }

                if(params.Key.SK.S.endsWith("#02")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat02)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("5");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("1");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }
            }

            const dynamoDbMock = new DynamoDbMock([validateParams], expectedUpdateResults);

            const promise = updateMetrics(dynamoDbMock, testValues.categoryAndValueUpdateEvent);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update metrics after multiple transactions categoryId has been updated', () => {

            const validateParams = params => {
                expect(params.ExpressionAttributeNames["#count"]).to.be.equals("count");
                expect(params.ExpressionAttributeNames["#sum"]).to.be.equals("sum");

                if(params.Key.SK.S.endsWith("#01")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat01)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("-5");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("-2");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }

                if(params.Key.SK.S.endsWith("#02")) {
                    expect(params.Key.SK.S).to.be.oneOf(testValues.dbRangeKeysCat02)
                    expect(params.ExpressionAttributeValues[":sum"].N).to.be.equals("5");
                    expect(params.ExpressionAttributeValues[":count"].N).to.be.equals("2");
                    expect(params.UpdateExpression).to.be.equals("ADD #count :count,#sum :sum ");
                }
            }

            const dynamoDbMock = new DynamoDbMock([validateParams], expectedUpdateResults);

            const promise = updateMetrics(dynamoDbMock, testValues.multipleCategoriesUpdate);

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

            const deleteMetricsValidators = testValues.retrieveMetricsResult.Items.map((item, index) => {
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

            const metricsUpdateValidators = testValues.metricUpdateItemsResults.map((item, index) => {
                return (params) => {
                    expect(params.Item).to.be.deep.equals(item.Attributes, `Validating item ${index}`);
                }
            });

            const validators = [queryMetricsValidator]
                .concat(deleteMetricsValidators)
                .concat([transactionQueryValidator])
                .concat(metricsUpdateValidators);
            const results = [testValues.retrieveMetricsResult]
                .concat(testValues.deleteMetricsResults)
                .concat([testValues.queryTransactionsResult])
                .concat(testValues.metricUpdateItemsResults);

            const dynamoDbMock = new DynamoDbMock(validators, results);

            const promise = recalculateMetrics(dynamoDbMock, testValues.recalculateMetricsEvent);

            return expect(promise).to.be.fulfilled;
        });
    });
});