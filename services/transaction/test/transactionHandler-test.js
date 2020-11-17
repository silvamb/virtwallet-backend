const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');
const testValues = require('./testValues');
const createTransactionsValues = require('./createTransactions.test.values');
const updateTransactionsValues = require('./updateTransactions.test.values');
const deleteTransactionsValues = require('./deleteTransactions.test.values');
const { DynamoDb } = require("libs/dynamodb");

const TransactionHandler = require('../src/transactionHandler').TransactionHandler;

const expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};

const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateTransactionUpdatedEvent = (params) => {
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

const validateUpdateVersionParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
};

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

            const transactionHandler = new TransactionHandler(new DynamoDbMock([validateParams], [expectedResult]));
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

            const transactionHandler = new TransactionHandler(new DynamoDbMock([validateParams], [expectedResult]));
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

            const transactionHandler = new TransactionHandler(new DynamoDbMock([validateParams], [expectedResult]));
            const promise = transactionHandler.list(parameters);

            const expectedList = testValues.orderTestExpectedList.reverse();

            return expect(promise).to.eventually.deep.equals(expectedList);
        });
    });

    describe('CreateTransactionTests', () => {
        it('should create transactions', () => {

            const validateParamsList = createTransactionsValues.transactionsToCreate.map(transaction => {
                return (params) => {
                    expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${createTransactionsValues.ACCOUNT_ID}`);
                    expect(params.Item.SK.S).to.be.equal(`TX#0001#${transaction.txDate}#${transaction.txId}`);
                    expect(params.Item.txId.S).to.be.equal(transaction.txId);
                    expect(params.Item.txDate.S).to.be.equal(transaction.txDate);
                    expect(params.Item.accountId.S).to.be.equal(createTransactionsValues.ACCOUNT_ID);
                    expect(params.Item.walletId.S).to.be.equal("0001");
                    expect(params.Item.dt.S).to.be.equal(transaction.dt);
                    expect(params.Item.value.N).to.be.equal(String(transaction.value));
                    expect(params.Item.description.S).to.be.equal(transaction.description);
                    expect(params.Item.type.S).to.be.equal(transaction.type);
                    expect(params.Item.balance.N).to.be.equal(String(transaction.balance));
                    expect(params.Item.balanceType.S).to.be.equal(transaction.balanceType);
                    expect(params.Item.includedBy.S).to.be.equal(createTransactionsValues.CLIENT_ID);
                    expect(params.Item.categoryId.S).to.be.equal(transaction.categoryId);
                    expect(params.Item.keyword.S).to.be.equal(transaction.keyword);
                    expect(params.Item.source.S).to.be.equal("MANUAL");
                    expect(params.Item.sourceType.S).to.be.equal("M");
                    expect(params.Item.referenceMonth.S).to.be.equal(transaction.referenceMonth);
                    expect(params.Item.versionId.N).to.be.equal(String(1));
                }
            })
            validateParamsList.push(validateUpdateVersionParams);
            const expectedResults = Array(3).fill(createTransactionsValues.putItemResult).concat(testValues.versionUpdateResult);
            const dynamoDbMock = new DynamoDbMock(validateParamsList, expectedResults);
            
            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(createTransactionsValues.createTransactionsUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(createTransactionsValues.createTransactionsUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(createTransactionsValues.createTransactionsUpdateVersionEvent.Detail);
            };
            const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);

            const transactionHandler = new TransactionHandler(dynamoDbMock, eventBridgeMock);
            const promise = transactionHandler.create(createTransactionsValues.createTransactionsParameters);

            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('DeleteAllTransactionTests', () => {
        it('should delete all transactions from a wallet', () => {
            const validateQueryParams = (params) => {
                expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
                expect(params.ProjectionExpression).to.be.equals("PK,SK");
                expect(params.ExpressionAttributeValues).to.deep.include({":pk":{S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"}});
                expect(params.ExpressionAttributeValues).to.deep.include({":sk":{S: "TX#0001"}});
            };

            const validateDeleteItemsParams = (params) => {
                expect(params).to.be.deep.equals(deleteTransactionsValues.expectedDeleteParams);
            };

            const dbParamsValidators = [validateQueryParams, validateDeleteItemsParams];
            const dbResults = [deleteTransactionsValues.queryTransactionsResult, deleteTransactionsValues.deleteTransactionsResult]
            const dynamoDbMock = new DynamoDbMock(dbParamsValidators, dbResults);

            const transactionHandler = new TransactionHandler(dynamoDbMock);
            const promise = transactionHandler.deleteAll(deleteTransactionsValues.deleteTransactionsParameters);
            return expect(promise).to.eventually.be.fulfilled;
        });
    });

    describe('UpdateTransactionTests', () => {
        it('should update a transaction with success', () => {

            const validateTxUpdateParams = params => {
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-02-04#202002040001");
                expect(params.ExpressionAttributeNames["#balance"]).to.be.equals("balance");
                expect(params.ExpressionAttributeNames["#description"]).to.be.equals("description");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":balance"].N).to.be.equals("123.4");
                expect(params.ExpressionAttributeValues[":description"].S).to.be.equals("Some Desc");
                expect(params.ExpressionAttributeValues[":old_balance"].N).to.be.equals("0");
                expect(params.ExpressionAttributeValues[":old_description"].S).to.be.equals("No Desc");
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #balance = :balance,#description = :description");
                expect(params.ConditionExpression).to.be.equals("#balance = :old_balance AND #description = :old_description");
            }
            const dbParamsValidators = [validateTxUpdateParams, validateUpdateVersionParams];
            const dbResults = [updateTransactionsValues.nonNotifiableAttrToUpdateTxResult, testValues.versionUpdateResult];

            const dynamoDbMock = new DynamoDbMock(dbParamsValidators, dbResults);

            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateTransactionsValues.nonNotifiableAttrToUpdateTxUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateTransactionsValues.nonNotifiableAttrToUpdateTxUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateTransactionsValues.nonNotifiableAttrToUpdateTxUpdateVersionEvent.Detail);
            }

            const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);
            
            const transactionHandler = new TransactionHandler(dynamoDbMock, eventBridgeMock);
            const promise = transactionHandler.update(updateTransactionsValues.nonNotifiableAttrToUpdateTxParameters);

            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should update a transaction notifiable attribute with success', () => {
            const validateTxUpdateParams = params => {
                console.log("params.Key.SK", JSON.stringify(params.Key.SK))
                expect(params.Key.PK.S).to.equals("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Key.SK.S).to.equals("TX#0001#2020-02-03#202002030001");
                expect(params.ExpressionAttributeNames["#value"]).to.be.equals("value");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":value"].N).to.be.equals("2.9");
                expect(params.ExpressionAttributeValues[":old_value"].N).to.be.equals("1.5");
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #value = :value");
                expect(params.ConditionExpression).to.be.equals("#value = :old_value");
            }

            const dbParamsValidators = [validateTxUpdateParams, validateUpdateVersionParams];
            const dbResults = [updateTransactionsValues.notifiableAttrToUpdateTxResult, testValues.versionUpdateResult];

            const dynamoDbMock = new DynamoDbMock(dbParamsValidators, dbResults);

            const validateTransactionUpdatedEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateTransactionsValues.notifiableAttrToUpdateTxUpdateVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateTransactionsValues.notifiableAttrToUpdateTxUpdateVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateTransactionsValues.notifiableAttrToUpdateTxUpdateVersionEvent.Detail);
            }

            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(updateTransactionsValues.transactionUpdatedEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(updateTransactionsValues.transactionUpdatedEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(updateTransactionsValues.transactionUpdatedEvent.Detail);
            }

            const eventBridgeMock = new EventBridgeMock([validateTransactionUpdatedEventParams, validatePutVersionEventParams]);

            const transactionHandler = new TransactionHandler(dynamoDbMock, eventBridgeMock);
            const promise = transactionHandler.update(updateTransactionsValues.notifiableAttrToUpdateTxParameters);
            return expect(promise).to.eventually.be.fulfilled;
        });

        it('should fail when trying to update a transaction with missing old attributes', () => {
            const parameters = {
                clientId: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
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
                clientId: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
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
                clientId: "ef471999-eb8f-5bc5-b39d-037e99f341c4",
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