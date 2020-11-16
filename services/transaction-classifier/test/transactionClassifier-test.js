const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const testValues = require('./testValues');

const TransactionClassifierHandler = require('../src/transactionClassifierHandler').TransactionClassifierHandler;

// Refactor to a more fluent class
class Mock {

    constructor(mockConfig) {
        this.mockConfig = mockConfig;
        this._setUp(mockConfig);
    }

    _setUp(mockConfig) {
        for(let mockedFunction in mockConfig) {
            this[mockedFunction] = (params) => {
                const currentCall = mockConfig[mockedFunction].shift();
                currentCall.validateFunction(params);
                return {
                    promise: () => {
                        return Promise.resolve(currentCall.returnValues);
                    }
                }
            }
        }
    }
};

const validateParams = (params) => {
    expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
    expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#");
    expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
};


const validateUpdateVersionParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
};

const expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};

class EventBridgeMock {
    constructor(expectedCategory) {
        this.expectedCategory = expectedCategory;
    }

    putEvents(params){
        expect(params.Entries[0].Source).to.be.equal("virtwallet");
        expect(params.Entries[0].DetailType).to.be.equal("transactions classified");
        const detail = JSON.parse(params.Entries[0].Detail);
        expect(detail.account).to.be.equal("4801b837-18c0-4277-98e9-ba57130edeb3");
        expect(detail.wallet).to.be.equal("0001");
        expect(detail.parserName).to.be.equal("ulster_csv_parser");
        expect(detail.fileName).to.be.equal("myfile.csv");
        expect(detail.bucketName).to.be.equal("my-bucket");
        expect(detail.objectKey).to.be.equal("account-files/4801b837-18c0-4277-98e9-ba57130edeb3/0001/parsers/ulster_csv_parser/myfile.csv");
        expect(detail.transactions.length).to.be.equal(1);
        expect(detail.transactions[0].categoryId).to.be.equal(this.expectedCategory);

        return {
            promise: () => {
                return Promise.resolve(expectedPutEventResult);
            }
        }
    }
}

const expectedQueryResult = testValues.categoryRulesItems;

const fileInfo = {
    account: '4801b837-18c0-4277-98e9-ba57130edeb3',
    wallet: '0001',
    parserName: 'ulster_csv_parser',
    fileName: 'myfile.csv',
    bucketName: 'my-bucket',
    objectKey: 'account-files/4801b837-18c0-4277-98e9-ba57130edeb3/0001/parsers/ulster_csv_parser/myfile.csv'
};

describe('TransactionClassifierHandler unit tests', () => {
    describe('classify transaction tests', () => {
        it('should classify a transaction by its keyword', () => {
            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateParams,
                        returnValues: expectedQueryResult
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);
            const eventBridgeMock = new EventBridgeMock("01");

            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const detail = {
                transactions: [
                    {
                        txDate: "2020-01-01",
                        txId: "202001010001",
                        dt: "2020-01-01T00:00:00.000Z",
                        value: "5.27",
                        description: "Transaction1",
                        type: "GSD",
                        balance: "4000",
                        balanceType: "Debit",
                        includedBy: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
                        version: 1,
                        keyword: "MyKeyword"
                    }
                ]
            };
            Object.assign(detail, fileInfo);
            const promise = transactionClassifierHandler.classifyAndPublishTransactions(detail);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should classify a transaction by expression rule', () => {
            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateParams,
                        returnValues: expectedQueryResult
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);

            const eventBridgeMock = new EventBridgeMock("03");

            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const detail = {
                transactions: [
                    {
                        txDate: "2020-01-01",
                        txId: "202001010001",
                        dt: "2020-01-01T00:00:00.000Z",
                        value: "5.27",
                        description: "Transaction1",
                        type: "GSD",
                        balance: "4000",
                        balanceType: "Debit",
                        includedBy: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
                        version: 1,
                        keyword: "AnotherKeyword"
                    }
                ]
            };
            Object.assign(detail, fileInfo);
            const promise = transactionClassifierHandler.classifyAndPublishTransactions(detail);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should classify a transaction with no category', () => {
            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateParams,
                        returnValues: expectedQueryResult
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);

            const eventBridgeMock = new EventBridgeMock("NO_CATEGORY");

            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const detail = {
                transactions: [
                    {
                        txDate: "2020-01-01",
                        txId: "202001010001",
                        dt: "2020-01-01T00:00:00.000Z",
                        value: "5.27",
                        description: "Doesn't Match",
                        type: "GSD",
                        balance: "4000",
                        balanceType: "Debit",
                        includedBy: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
                        version: 1,
                        keyword: "AnotherKeyword"
                    }
                ]
            };
            Object.assign(detail, fileInfo);
            const promise = transactionClassifierHandler.classifyAndPublishTransactions(detail);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should classify a transaction with no category when no rules are found', () => {
            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateParams,
                        returnValues: {
                            Count: 0,
                            Items: [],
                            ScannedCount: 0
                        }
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);

            const eventBridgeMock = new EventBridgeMock("NO_CATEGORY");

            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const detail = {
                transactions: [
                    {
                        txDate: "2020-01-01",
                        txId: "202001010001",
                        dt: "2020-01-01T00:00:00.000Z",
                        value: "5.27",
                        description: "Doesn't Match",
                        type: "GSD",
                        balance: "4000",
                        balanceType: "Debit",
                        includedBy: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
                        version: 1,
                        keyword: "AnotherKeyword"
                    }
                ]
            };
            Object.assign(detail, fileInfo);
            const promise = transactionClassifierHandler.classifyAndPublishTransactions(detail);

            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('reclassify transaction tests', () => {
        it('should reclassify the transactions with changes', () => {
            const validateTransactionQuery = params => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-03-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-03-02");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const validateUpdateItem = params => {
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-03-01#202003010001");
                expect(params.ExpressionAttributeNames["#categoryId"]).to.be.equals("categoryId");
                expect(params.ExpressionAttributeValues[":categoryId"].S).to.be.equals("01");
                expect(params.ExpressionAttributeValues[":old_categoryId"].S).to.be.equals("10");
                expect(params.UpdateExpression).to.be.equals(" SET #categoryId = :categoryId");
                expect(params.ConditionExpression).to.be.equals("#categoryId = :old_categoryId");
            }

            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateTransactionQuery,
                        returnValues: testValues.transactionItems
                    },
                    {
                        validateFunction: validateParams,
                        returnValues: testValues.categoryRulesItems
                    }
                ],
                updateItem: [
                    {
                        validateFunction: validateUpdateItem,
                        returnValues: testValues.updateTransactionResult
                    },
                    {
                        validateFunction: validateUpdateVersionParams,
                        returnValues: testValues.versionUpdateResult
                    }
                ]
            };
            const validateEvent = params => {
                expect(params.Entries[0].Source).to.be.equal("virtwallet");
                expect(params.Entries[0].DetailType).to.be.equal("transactions updated");
                const detail = JSON.parse(params.Entries[0].Detail);
                expect(detail.accountId).to.be.equal("4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(detail.walletId).to.be.equal("0001");
                expect(detail.changes[0].txDate).to.be.equal("2020-03-01");
                expect(detail.changes[0].txId).to.be.equal("202003010001");
                expect(detail.changes[0].old.categoryId).to.be.equal("10");
                expect(detail.changes[0].new.categoryId).to.be.equal("01");
            };

            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateVersionEvent.Detail);
            }

            const eventBridgeMockConfig = {
                putEvents: [
                    {
                        validateFunction: validateEvent,
                        returnValues: expectedPutEventResult
                    },
                    {
                        validateFunction: validatePutVersionEventParams,
                        returnValues: expectedPutEventResult
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);
            const eventBridgeMock = new Mock(eventBridgeMockConfig);
            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const promise = transactionClassifierHandler.reclassifyTransactions(testValues.reclassifyTxEvent);

            return expect(promise).to.eventually.be.deep.equals(testValues.expectedUpdateResult);
        });

        it('should reclassify the transactions with no changes', () => {
            const validateTransactionQuery = params => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-03-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-03-02");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
            };

            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateTransactionQuery,
                        returnValues: testValues.transactionItems
                    },
                    {
                        validateFunction: validateParams,
                        returnValues: testValues.categoryRulesSingleItem
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);
            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock);

            const promise = transactionClassifierHandler.reclassifyTransactions(testValues.reclassifyTxEvent);

            return expect(promise).to.eventually.be.deep.equals([]);
        });

        it('should reclassify only automatically inserted transactions', () => {
            const validateTransactionQuery = params => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-03-01");
                expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-03-02");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");
                expect(params.FilterExpression).to.be.equal("#sourceType = :sourceType");
                expect(params.ExpressionAttributeValues[":sourceType"].S).to.be.equal("A");
                expect(params.ExpressionAttributeNames["#sourceType"]).to.be.equal("sourceType");
            };

            const validateUpdateItem = params => {
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-03-01#202003010001");
                expect(params.ExpressionAttributeNames["#categoryId"]).to.be.equals("categoryId");
                expect(params.ExpressionAttributeValues[":categoryId"].S).to.be.equals("01");
                expect(params.ExpressionAttributeValues[":old_categoryId"].S).to.be.equals("10");
                expect(params.UpdateExpression).to.be.equals(" SET #categoryId = :categoryId");
                expect(params.ConditionExpression).to.be.equals("#categoryId = :old_categoryId");
            }

            const dynamoDbMockConfig = {
                query: [
                    {
                        validateFunction: validateTransactionQuery,
                        returnValues: testValues.transactionItems
                    },
                    {
                        validateFunction: validateParams,
                        returnValues: testValues.categoryRulesItems
                    }
                ],
                updateItem: [
                    {
                        validateFunction: validateUpdateItem,
                        returnValues: testValues.updateTransactionResult
                    },
                    {
                        validateFunction: validateUpdateVersionParams,
                        returnValues: testValues.versionUpdateResult
                    }
                ]
            };
            const validateEvent = params => {
                expect(params.Entries[0].Source).to.be.equal("virtwallet");
                expect(params.Entries[0].DetailType).to.be.equal("transactions updated");
                const detail = JSON.parse(params.Entries[0].Detail);
                expect(detail.accountId).to.be.equal("4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(detail.walletId).to.be.equal("0001");
                expect(detail.changes[0].txDate).to.be.equal("2020-03-01");
                expect(detail.changes[0].txId).to.be.equal("202003010001");
                expect(detail.changes[0].old.categoryId).to.be.equal("10");
                expect(detail.changes[0].new.categoryId).to.be.equal("01");
            };

            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateVersionEvent.Detail);
            }

            const eventBridgeMockConfig = {
                putEvents: [
                    {
                        validateFunction: validateEvent,
                        returnValues: expectedPutEventResult
                    },
                    {
                        validateFunction: validatePutVersionEventParams,
                        returnValues: expectedPutEventResult
                    }
                ]
            };

            const dynamoDbMock = new Mock(dynamoDbMockConfig);
            const eventBridgeMock = new Mock(eventBridgeMockConfig);
            const transactionClassifierHandler = new TransactionClassifierHandler(dynamoDbMock, eventBridgeMock);

            const event = Object.assign({}, testValues.reclassifyTxEvent);
            event.queryStringParameters.filters = "auto";
            const promise = transactionClassifierHandler.reclassifyTransactions(event);

            return expect(promise).to.eventually.be.deep.equals(testValues.expectedUpdateResult);
        });
    });
});