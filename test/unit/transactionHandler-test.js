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
    }

    putItem(params) {
        this.validateFunction(params);

        return {
            promise: () => {
                return waitAndReturn(50, this.returnValues);
            }
        }
    }

    query(params) {
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
                    to: "2020-01-01T00:00:00.000Z",
                    from: "2020-01-18T23:59:59.999Z"
                }
            };

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("TRANSACTION#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f");
                expect(params.ExpressionAttributeValues[":dt_start"].S).to.be.equal("2020-01-01T00:00:00.000Z");
                expect(params.ExpressionAttributeValues[":dt_end"].S).to.be.equal("2020-01-18T23:59:59.999Z");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
                expect(params.FilterExpression).to.be.equal("dt BETWEEN :dt_start AND :dt_end");
            };

            // TODO Add this to a JSON file
            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                        SK: { "S": "TRANSACTION#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
                        transactionId: { "S": "202001010001" },
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
                ScannedCount: 1
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.list(event);

            // TODO Add this to a JSON file
            const expectedList = {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f",
                transactionId: "202001010001",
                dt: "2020-01-01T00:00:00.000Z",
                value: 19.9,
                description: "Transaction Test",
                type: "POS",
                balance: 1234.56,
                balanceType: "Debit",
                includedBy: "10v21l6b17g3t27sfbe38b0i8n",
                version: 1,
                category: "NO_CATEGORY",
                source: "MANUAL"
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
                        SK: { "S": "TRANSACTION#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
                        transactionId: { "S": "202001010001" },
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
                    CapacityUnits: 134.0,
                    ReadCapacityUnits: 67.0,
                    WriteCapacityUnits: 67.0
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
                        SK: { "S": "TRANSACTION#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f#202001010001" },
                        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                        walletId: { "S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f" },
                        transactionId: { "S": "202001010001" },
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
                    CapacityUnits: 134.0,
                    ReadCapacityUnits: 67.0,
                    WriteCapacityUnits: 67.0
                }
            };

            const validateParams = (params) => {
            };

            const transactionHandler = new TransactionHandler(new DynamoDbMock(validateParams, expectedResult));
            const promise = transactionHandler.create(event);

            return expect(promise).to.eventually.deep.include(expectedResult);
        });
    });
});