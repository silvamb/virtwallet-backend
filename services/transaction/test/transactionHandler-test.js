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

            const expectedResult = {
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
                    CapacityUnits: 1.0,
                    ReadCapacityUnits: 1.0,
                    WriteCapacityUnits: 1.0
                }
            };

            const validateParams = (params) => {
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.create(parameters);

            return expect(promise).to.eventually.deep.include(expectedResult);
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
});