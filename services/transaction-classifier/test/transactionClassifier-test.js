const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const TransactionClassifierHandler = require('../src/transactionClassifierHandler').TransactionClassifierHandler;

class DynamoDbMock {

    constructor(validateFunction, returnValues = {ScannedItems: 1}) {
        this.validateFunction = validateFunction;
        this.returnValues = returnValues;
        this.putItem = this.mock;
        this.query = this.mock;
    }

    mock(params) {
        this.validateFunction(params);

        return {
            promise: () => {
                return Promise.resolve(this.returnValues);
            }
        }
    }


};

const validateParams = (params) => {
    expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
    expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("RULE#");
    expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
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

const expectedQueryResult = {
    Count: 3,
    Items: [
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#KEYWORD#Transaction1"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            keyword:  {"S": "MyKeyword"},
            categoryId:  {"S": "01"},
            name: {"S": "Category Name"},
        },
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#EXPRESSION#01"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            ruleId:  {"S": "02"},
            ruleType:  {"S": "contains"},
            parameter:  {"S": "Transaction"},
            name:  {"S": "Rule01"},
            priority: {"N": "30"},
            categoryId:  {"S": "02"}
        },
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#EXPRESSION#01"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            ruleId:  {"S": "01"},
            ruleType:  {"S": "startsWith"},
            parameter:  {"S": "Transaction"},
            name:  {"S": "Rule01"},
            priority: {"N": "10"},
            categoryId:  {"S": "03"}
        }
    ],
    ScannedCount: 3
};

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
            const dynamoDbMock = new DynamoDbMock(validateParams, expectedQueryResult);
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
                        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
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
            const dynamoDbMock = new DynamoDbMock(validateParams, expectedQueryResult);

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
                        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
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
            const dynamoDbMock = new DynamoDbMock(validateParams, expectedQueryResult);

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
                        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
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
            const emptyResult = {
                Count: 0,
                Items: [],
                ScannedCount: 0
            };
            const dynamoDbMock = new DynamoDbMock(validateParams, emptyResult);

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
                        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
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
});