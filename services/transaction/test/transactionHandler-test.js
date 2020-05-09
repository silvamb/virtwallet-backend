const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

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

describe('TransactionHandler unit tests', () => {
    describe('list transactions tests', () => {
        it('should list transactions in a period with success', () => {

            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                from: "2020-01-01",
                to: "2020-01-18"
            }

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":SK_start"].S).to.be.equal("TX#0001#2020-01-01");
                expect(params.ExpressionAttributeValues[":SK_end"].S).to.be.equal("TX#0001#2020-01-18");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :SK_start AND :SK_end");
            };

            // TODO Add this to a JSON file
            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#0001#2020-01-01#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "0001" },
                        txDate: { "S": "2020-01-01" },
                        txId: { "S": "202001010001" },
                        dt: { "S": "2020-01-01T00:00:00.000Z" },
                        value: { "N": "19.9" },
                        description: { "S": "Transaction Test" },
                        type: { "S": "POS" },
                        balance: { "N": "1234.56" },
                        balanceType: { "S": "Debit" },
                        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
                        version: { "N": 1 },
                        categoryId: { "S": "NO_CATEGORY"},
                        keyword: { "S": "Transaction"},
                        source: { "S": "JOHNDOE12345678-20200107.csv"},
                        sourceType: {"S": "A"}
                    }
                ],
                ScannedCount: 1
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(parameters);

            // TODO Add this to a JSON file
            const expectedList = {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-01-01",
                txId: "202001010001",
                dt: "2020-01-01T00:00:00.000Z",
                value: "19.9",
                description: "Transaction Test",
                type: "POS",
                balance: "1234.56",
                balanceType: "Debit",
                includedBy: "10v21l6b17g3t27sfbe38b0i8n",
                version: 1,
                categoryId: "NO_CATEGORY",
                keyword: "Transaction",
                source: "JOHNDOE12345678-20200107.csv",
                sourceType: "A"
            };

            return expect(promise).to.eventually.deep.include(expectedList);
        });
    });

    describe('CreateTransactionTests', () => {
        it('should create transactions in a bulk less than 25', () => {
            const eventJson =  fs.readFileSync('./test/events/transactions_15.json');
            const event = JSON.parse(eventJson);

            const parameters = {
                clientId: event.requestContext.authorizer.claims.client_id,
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
                        keyword: { "S": "Transaction"}
                    }
                ],
                ConsumedCapacity: {
                    TableName: "virtwallet",
                    CapacityUnits: 1
                }
            };

            const validateParams = (params) => {
            };

            const expectedResult = Array(15).fill({success: true});

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedItem));
            const promise = transactionHandler.create(parameters);

            return expect(promise).to.eventually.be.deep.equals(expectedResult);
        });

        it('should create a single transaction', () => {
            const eventJson =  fs.readFileSync('./test/events/transactions_1.json');
            const event = JSON.parse(eventJson);
            
            const parameters = {
                clientId: event.requestContext.authorizer.claims.client_id,
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
                        keyword: { "S": "Transaction"}
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
            // TODO Add this to a JSON file
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
                txId: "202002040001",
                transactions: {
                    old: {
                        "categoryId": "NO_CATEGORY",
                        "description": "No Desc"
                    },
                    new: {
                        "categoryId": "01",
                        "description": "Some Desc"
                    }
                }
            };

            const expectedUpdateResult = {
                "Attributes": {
                    "categoryId": {
                        "S": "01"
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
                expect(params.ExpressionAttributeNames["#categoryId"]).to.be.equals("categoryId");
                expect(params.ExpressionAttributeNames["#description"]).to.be.equals("description");
                expect(params.ExpressionAttributeValues[":categoryId"].S).to.be.equals("01");
                expect(params.ExpressionAttributeValues[":description"].S).to.be.equals("Some Desc");
                expect(params.ExpressionAttributeValues[":old_categoryId"].S).to.be.equals("NO_CATEGORY");
                expect(params.ExpressionAttributeValues[":old_description"].S).to.be.equals("No Desc");
                expect(params.UpdateExpression).to.be.equals(" SET #categoryId = :categoryId,#description = :description");
                expect(params.ConditionExpression).to.be.equals("#categoryId = :old_categoryId AND #description = :old_description");
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

        it('should fail when trying to update a transaction with missing old attributes', () => {
            const parameters = {
                clientId: "10v21l6b17g3t27sfbe38b0i8n",
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001",
                txDate: "2020-02-04",
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
    });
});