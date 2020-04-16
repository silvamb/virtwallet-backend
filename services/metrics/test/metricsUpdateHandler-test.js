const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const updateMetrics = require("../src/metricsUpdateHandler").updateMetrics;

class DynamoDbMock {

    constructor(paramsValidator) {
        this.paramsValidator = paramsValidator;
    }


    updateItem(params) {
        this.paramsValidator(params);
        return {
            promise: () => {
                return Promise.resolve({
                    "Attributes": {
                        "sum": {
                            "N": "6"
                        },
                        "count": {
                            "N": "3"
                        },
                        "PK": {
                            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                        },
                        "SK": {
                          "S": "METRIC#0001#20200204"
                        }
                    }
                });
            }
        }
    }


};

describe('MetricsUpdateHandler unit tests', () => {
    describe('update metrics tests', () => {
        it('should update metrics for same day and same category', () => {

            const details = {
                transactions: [
                    {
                        accountId: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
                        walletId: '0001',
                        txDate: "2020-02-01",
                        value: "4",
                        categoryId: "01"
                    },
                    {
                        accountId: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
                        walletId: '0001',
                        txDate: "2020-02-01",
                        value: "5",
                        categoryId: "01"
                    }
                ]
            };

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

            const dynamoDbMock = new DynamoDbMock(validateParams);

            const promise = updateMetrics(dynamoDbMock, details);

            return expect(promise).to.eventually.be.fulfilled;
        });
    });
});