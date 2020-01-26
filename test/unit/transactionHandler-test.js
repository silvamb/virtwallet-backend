const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const TransactionHandler = require('../../src/lambdas/transaction/transactionHandler').TransactionHandler;

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

            // TODO Add this to a JSON file
            const event = {
                httpMethod: 'GET',
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: "10v21l6b17g3t27sfbe38b0i8n"
                        }
                    }
                },
                pathParameters: {
                    accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                    walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"
                },
                queryStringParameters: {
                    from: "2020-01-01",
                    to: "2020-01-18"
                }
            };

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":SK_start"].S).to.be.equal("TX#2020-01-01");
                expect(params.ExpressionAttributeValues[":SK_end"].S).to.be.equal("TX#2020-01-18");
                expect(params.FilterExpression).to.be.equals("walletId = :walletId");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :SK_start AND :SK_end");
                expect(params.ExpressionAttributeValues).to.deep.include({":walletId":{S: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"}});
            };

            // TODO Add this to a JSON file
            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#2020-01-01#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
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
                        category: { "S": "NO_CATEGORY"},
                        source: { "S": "JOHNDOE12345678-20200107.csv"},
                        sourceType: {"S": "A"}
                    }
                ],
                ScannedCount: 1
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(event);

            // TODO Add this to a JSON file
            const expectedList = {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f",
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
                category: "NO_CATEGORY",
                source: "JOHNDOE12345678-20200107.csv",
                sourceType: "A"
            };

            return expect(promise).to.eventually.deep.include(expectedList);
        });
    });

    describe('CreateTransactionTests', () => {
        it('should create transactions in a bulk less than 25', () => {
            const eventJson =  fs.readFileSync('./test/unit/events/transactions_15.json');
            const event = JSON.parse(eventJson);
            
            const expectedResult = {
                Attributes: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#2020-01-01#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
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
                        category: { "S": "NO_CATEGORY"}
                    }
                ],
                ConsumedCapacity: {
                    TableName: "virtwallet",
                    CapacityUnits: 1
                }
            };

            const validateParams = (params) => {
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.create(event);

            return expect(promise).to.eventually.deep.include(expectedResult);
        });

        it('should create a single transaction', () => {
            const eventJson =  fs.readFileSync('./test/unit/events/transactions_1.json');
            const event = JSON.parse(eventJson);
            
            const expectedResult = {
                Attributes: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TX#2020-01-01#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
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
                        category: { "S": "NO_CATEGORY"}
                    }
                ],
                ConsumedCapacity: {
                    TableName: "virtwallet",
                    CapacityUnits: 1.0,
                    ReadCapacityUnits: 1.0,
                    WriteCapacityUnits: 1.0
                }
            };

            const validateParams = (params) => {
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.create(event);

            return expect(promise).to.eventually.deep.include(expectedResult);
        });
    });

    describe('DeleteAllTransactionTests', () => {
        it('should delete all transactions', () => {
            // TODO Add this to a JSON file
            const event = {
                httpMethod: 'DELETE',
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: "10v21l6b17g3t27sfbe38b0i8n"
                        }
                    }
                },
                pathParameters: {
                    accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                    walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"
                }
            };

            const expectedQueryResult = {
                "Items": [
                    {
                        "PK": {
                            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                        },
                        "SK": {
                            "S": "TX#2019-12-30#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#201912300011"
                        }
                    },
                    {
                        "PK": {
                            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
                        },
                        "SK": {
                            "S": "TX#2019-12-30#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#201912300012"
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
                    expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND SK BETWEEN :SK_start AND :SK_end");
                    expect(params.ProjectionExpression).to.be.equals("PK,SK");
                    expect(params.FilterExpression).to.be.equals("walletId = :walletId");
                    expect(params.ExpressionAttributeValues).to.deep.include({":pk":{S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"}});
                    expect(params.ExpressionAttributeValues).to.deep.include({":SK_start":{S: "TX#0000-00-00"}});
                    expect(params.ExpressionAttributeValues).to.deep.include({":SK_end":{S: "TX#9999-99-99"}});
                    expect(params.ExpressionAttributeValues).to.deep.include({":walletId":{S: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"}});

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
            const promise = transactionHandler.deleteAll(event);
            return expect(promise).to.eventually.be.fulfilled;
        });
    });
});