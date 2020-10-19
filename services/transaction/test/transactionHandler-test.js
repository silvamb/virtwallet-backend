const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');
const testValues = require('./testValues');

const TransactionHandler = require('../src/transactionHandler').TransactionHandler;

async function waitAndReturn(maxTime, retVal) {
    return new Promise(resolve => {
        const timeout = Math.floor(Math.random() * Math.floor(maxTime));
        setTimeout(() => resolve(retVal), timeout);
    });
}

class DynamoDbMock {

    constructor(validateFunction, returnValues = {ScannedItems: 1}) {
        this.validateFunction = validateFunction;
        this.returnValues = returnValues;
        this.putItem = this.mock;
        this.query = this.mock;
        this.batchWriteItem = this.mock;
    }

    mock(params) {
        this.validateFunction(params);

        return {
            promise: () => {
                return waitAndReturn(20, this.returnValues);
            }
        }
    }
};

const expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};

class EventBridgeMock {
    constructor(parameters) {
        this.parameters = parameters;
    }

    putEvents(params){
        expect(params.Entries[0].Source).to.be.equal("virtwallet");
        expect(params.Entries[0].DetailType).to.be.equal("transaction updated");
        const detail = JSON.parse(params.Entries[0].Detail);
        expect(detail).to.be.deep.equals(this.parameters);

        return {
            promise: () => {
                return Promise.resolve(expectedPutEventResult);
            }
        }
    }
}

describe('TransactionHandler unit tests', () => {
    describe('list transactions tests', () => {
        it('should list transactions in a period with success', () => {

            const parameters = testValues.listTransactionsParams;

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-01-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-01-18");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const expectedResult = testValues.listTestDbResponse;

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(parameters);

            const expectedList = testValues.listTestExpectedList;

            return expect(promise).to.eventually.become(expectedList);
        });

        it('should list transactions in a period in an asc ordering', () => {

            const parameters = testValues.orderTestAscParams;

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-01-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-01-18");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const expectedResult = testValues.orderTestDbResponse;

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(parameters);

            const expectedList = testValues.orderTestExpectedList;

            return expect(promise).to.eventually.become(expectedList);
        });

        it('should list transactions in a period in a desc ordering', () => {

            const parameters = testValues.orderTestDescParams

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-01-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-01-18");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const expectedResult = testValues.orderTestDbResponse;

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(parameters);

            const expectedList = testValues.orderTestExpectedList.reverse();

            return expect(promise).to.eventually.deep.equals(expectedList);
        });
    });

    describe('CreateTransactionTests', () => {
        it('should create transactions in a bulk less than 25', () => {
            const eventJson =  fs.readFileSync('./test/events/transactions_15.json');
            const event = JSON.parse(eventJson);

            const parameters = {
                clientId: event.requestContext.authorizer.claims.aud,
                accountId: event.pathParameters.accountId,
                walletId: event.pathParameters.walletId,
                txId: event.pathParameters.txId,
                transactions: event.body ? JSON.parse(event.body) : undefined,
                to: event.queryStringParameters ? event.queryStringParameters.to : null,
                from: event.queryStringParameters ? event.queryStringParameters.from : null
            };
            
            const expectedItem = {
                Attributes: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#0001#2020-01-01#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "0001" },
                        txDate: { "S": "2020-01-01" },
                        txId: { "S": "202001010001" },
                        dt: { "S": "2020-01-01T00:00:00.000Z" },
                        value: { "N": 19.9 },
                        description: { "S": "Transaction Test" },
                        type: { "S": "POS" },
                        balance: { "N": 1234.56 },
                        balanceType: { "S": "Debit" },
                        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
                        version: { "N": 1},
                        categoryId: { "S": "NO_CATEGORY"},
                        keyword: { "S": "Transaction"},
                        referenceMonth: {"S": "2020-01"}
                    }
                ],
                ConsumedCapacity: {
                    TableName: "virtwallet",
                    CapacityUnits: 1
                }
            };

            const validateParams = (params) => {
            };

            const expectedResult = Array(15).fill({success: true, data: expectedItem});

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedItem));
            const promise = transactionHandler.create(parameters);

            return expect(promise).to.eventually.be.deep.equals(expectedResult);
        });

        it('should create a single transaction', () => {
            const eventJson =  fs.readFileSync('./test/events/transactions_1.json');
            const event = JSON.parse(eventJson);
            
            const parameters = {
                clientId: event.requestContext.authorizer.claims.aud,
                accountId: event.pathParameters.accountId,
                walletId: event.pathParameters.walletId,
                txId: event.pathParameters.txId,
                transactions: event.body ? JSON.parse(event.body) : undefined,
                to: event.queryStringParameters ? event.queryStringParameters.to : null,
                from: event.queryStringParameters ? event.queryStringParameters.from : null
            };

            const putItemResult = {
                Attributes: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#0001#2020-01-01#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "0001" },
                        txDate: { "S": "2020-01-01" },
                        txId: { "S": "202001010001" },
                        dt: { "S": "2020-01-01T00:00:00.000Z" },
                        value: { "N": 19.9 },
                        description: { "S": "Transaction Test" },
                        type: { "S": "POS" },
                        balance: { "N": 1234.56 },
                        balanceType: { "S": "Debit" },
                        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
                        version: { "N": 1},
                        categoryId: { "S": "NO_CATEGORY"},
                        keyword: { "S": "Transaction"},
                        referenceMonth: {"S": "2020-01"},
                    }
                ],
                ConsumedCapacity: {
                    TableName: "virtwallet",
                    CapacityUnits: 1
                }
            };

            const validateParams = (params) => {
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, putItemResult));
            const promise = transactionHandler.create(parameters);

            const expectedResult = {
                success: true,
                data: putItemResult
            };

            return expect(promise).to.eventually.become(expectedResult);
        });
    });

    describe('DeleteAllTransactionTests', () => {
        it('should delete all transactions from a wallet', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
            }

            const expectedQueryResult = {
                "Items": [
                    {
                        "PK": {
                            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                        },
                        "SK": {
                            "S": "TX#0001#2019-12-30f#201912300011"
                        }
                    },
                    {
                        "PK": {
                            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                        },
                        "SK": {
                            "S": "TX#0001#2019-12-30#201912300012"
                        }
                    }
                ],
                "Count": 2,
                "ScannedCount": 2
            };

            const expectedDeleteParams = {
                RequestItems: {
                    "virtwallet": [
                        {
                            DeleteRequest: {
                                Key: {
                                    PK: expectedQueryResult.Items[0].PK,
                                    SK: expectedQueryResult.Items[0].SK
                                }
                            }
                        },
                        {
                            DeleteRequest: {
                                Key: {
                                    PK: expectedQueryResult.Items[1].PK,
                                    SK: expectedQueryResult.Items[1].SK
                                }
                            }
                        }
                    ]
                }
            }

            const dynamoDbMock = {
                query: (params) => {
                    expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
                    expect(params.ProjectionExpression).to.be.equals("PK,SK");
                    expect(params.ExpressionAttributeValues).to.deep.include({":pk":{S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"}});
                    expect(params.ExpressionAttributeValues).to.deep.include({":sk":{S: "TX#0001"}});

                    return {
                        promise: () => Promise.resolve(expectedQueryResult)
                    };
                },

                batchWriteItem: (params) => {
                    expect(params).to.be.deep.equals(expectedDeleteParams);

                    return {
                        promise: () => Promise.resolve({ UnprocessedItems: {} })
                    };
                }
            }

            const transactionHandler = new TransactionHandler(dynamoDbMock);
            const promise = transactionHandler.deleteAll(parameters);
            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('UpdateTransactionTests', () => {
        it('should update a transaction with success', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-04",
                referenceMonth: "2020-02",
                txId: "202002040001",
                transactions: {
                    old: {
                        "balance": 0.00,
                        "description": "No Desc"
                    },
                    new: {
                        "balance": 123.40,
                        "description": "Some Desc"
                    }
                }
            };

            const expectedUpdateResult = {
                "Attributes": {
                    "balance": {
                        "N": "123.4"
                    },
                    "description": {
                        "S": "Some Desc"
                    },
                    "PK": {
                        "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                    },
                    "SK": {
                      "S": "TX#0001#2020-02-04#202002040001"
                    }
                }
            };

            const validateParams = params => {
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-02-04#202002040001");
                expect(params.ExpressionAttributeNames["#balance"]).to.be.equals("balance");
                expect(params.ExpressionAttributeNames["#description"]).to.be.equals("description");
                expect(params.ExpressionAttributeValues[":balance"].N).to.be.equals("123.4");
                expect(params.ExpressionAttributeValues[":description"].S).to.be.equals("Some Desc");
                expect(params.ExpressionAttributeValues[":old_balance"].N).to.be.equals("0");
                expect(params.ExpressionAttributeValues[":old_description"].S).to.be.equals("No Desc");
                expect(params.UpdateExpression).to.be.equals(" SET #balance = :balance,#description = :description");
                expect(params.ConditionExpression).to.be.equals("#balance = :old_balance AND #description = :old_description");
            }

            const dynamoDbMock = {
                updateItem: (params) => {
                    validateParams(params);

                    return {
                        promise: () => Promise.resolve(expectedUpdateResult)
                    };
                }
            }

            const transactionHandler = new TransactionHandler(dynamoDbMock);
            const promise = transactionHandler.update(parameters);
            return expect(promise).to.eventually.become({data: expectedUpdateResult, success: true});
        });

        it('should update a transaction notifiable attribute with success', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-03",
                referenceMonth: "2020-02",
                txId: "202002030001",
                transactions: {
                    old: {
                        "value": 1.50
                    },
                    new: {
                        "value": 2.90
                    }
                }
            };

            const expectedUpdateResult = {
                "Attributes": {
                    "categoryId": {
                        "S": "01"
                    },
                    "value": {
                        "N": "2.9"
                    },
                    "PK": {
                        "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                    },
                    "SK": {
                      "S": "TX#0001#2020-02-04#202002040001"
                    }
                }
            };

            const validateParams = params => {
                console.log("params.Key.SK", JSON.stringify(params.Key.SK))
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-02-03#202002030001");
                expect(params.ExpressionAttributeNames["#value"]).to.be.equals("value");
                expect(params.ExpressionAttributeValues[":value"].N).to.be.equals("2.9");
                expect(params.ExpressionAttributeValues[":old_value"].N).to.be.equals("1.5");
                expect(params.UpdateExpression).to.be.equals(" SET #value = :value");
                expect(params.ConditionExpression).to.be.equals("#value = :old_value");
            }

            const dynamoDbMock = {
                updateItem: (params) => {
                    validateParams(params);

                    return {
                        promise: () => Promise.resolve(expectedUpdateResult)
                    };
                }
            };

            const expectedEvent = {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-03",
                referenceMonth: "2020-02",
                txId: "202002030001",
                old: {
                    categoryId: "01",
                    value: 1.5,
                },
                new: {
                    value: 2.9
                }
            };
            const eventBridgeMock = new EventBridgeMock(expectedEvent);

            const transactionHandler = new TransactionHandler(dynamoDbMock, eventBridgeMock);
            const promise = transactionHandler.update(parameters);
            return expect(promise).to.eventually.become({data: expectedUpdateResult, success: true});
        });

        it('should fail when trying to update a transaction with missing old attributes', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-04",
                referenceMonth: "2020-02",
                txId: "202002040001",
                transactions: {
                    old: {
                        "categoryId": "NO_CATEGORY"
                    },
                    new: {
                        "categoryId": "01",
                        "description": "Some Desc"
                    }
                }
            };

            const transactionHandler = new TransactionHandler();
            const promise = transactionHandler.update(parameters);
            return expect(promise).to.eventually.be.rejectedWith(Error, "Missing old value for attribute 'description'");
        });

        it('should fail when trying to update a transaction with invalid attributes', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-04",
                referenceMonth: "2020-02",
                txId: "202002040001",
                transactions: {
                    old: {
                        "categoryId": "NO_CATEGORY",
                        "nonsense": "this is not a transaction attr"
                    },
                    new: {
                        "categoryId": "01",
                        "nonsense": "this is not a transaction attr"
                    }
                }
            };

            const transactionHandler = new TransactionHandler();
            const promise = transactionHandler.update(parameters);
            return expect(promise).to.eventually.be.rejectedWith(Error, "Old attribute 'nonsense' is not a valid Transaction attribute");
        });

        it('should fail when trying to update a transaction read-only attribute', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-04",
                referenceMonth: "2020-02",
                txId: "202002040001",
                transactions: {
                    old: {
                        "categoryId": "NO_CATEGORY",
                        "accountId": "4801b837-18c0-4277-98e9-ba57130edeb3"
                    },
                    new: {
                        "categoryId": "01",
                        "accountId": "1"
                    }
                }
            };

            const transactionHandler = new TransactionHandler({});
            const promise = transactionHandler.update(parameters);
            return expect(promise).to.eventually.be.rejectedWith(Error, "Transaction attribute 'accountId' is not updatable");
        });
    });
});