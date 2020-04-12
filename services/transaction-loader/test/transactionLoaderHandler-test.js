const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const TransactionLoaderHandler = require('../src/transactionLoaderHandler').TransactionLoaderHandler;

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

describe('TransactionLoaderHandler unit tests', () => {
    it('should process single transaction with success', () => {
        const detail = {
            account: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
            wallet: '0001',
            parserName: 'ulster_csv_parser',
            fileName: 'myfile.csv',
            bucketName: 'my-bucket',
            objectKey: 'account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv',
            transactions: [{
                txDate: "2020-01-01",
                transactionId: "202001010001",
                dt: "2020-01-01T00:00:00.000Z",
                value: "5.27",
                description: "Transaction1",
                type: "GSD",
                balance: "4000",
                balanceType: "Debit"
            }]
        };

        const expectedResult = {
            ConsumedCapacity: {
                CapacityUnits: 1,
            }
        };

        const validateParams = (params) => {
            // TODO validate input
        };

        const transactionLoaderHandler = new TransactionLoaderHandler(new DynamoDbMock(validateParams, expectedResult));

        return expect(transactionLoaderHandler.processEvent(detail)).to.eventually.be.fulfilled;
    });

    it('should process two transactions with success', () => {
        const detail = {
            account: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
            wallet: '0001',
            parserName: 'ulster_csv_parser',
            fileName: 'myfile.csv',
            bucketName: 'my-bucket',
            objectKey: 'account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv',
            transactions: [{
                txDate: "2020-01-01",
                transactionId: "202001010001",
                dt: "2020-01-01T00:00:00.000Z",
                value: "5.27",
                description: "Transaction1",
                type: "GSD",
                balance: "4000",
                balanceType: "Debit",
                categoryId: "NO_CATEGORY",
                keyword: "Transaction1"
            },
            {
                txDate: "2020-01-01",
                transactionId: "202001010002",
                dt: "2020-01-02T00:00:00.000Z",
                value: "15.32",
                description: "Transaction2", 
                type: "POS",
                balance: "1000",
                balanceType: "Debit",
                categoryId: "NO_CATEGORY",
                keyword: "Transaction2"
            }]
        };

        const expectedResult = {
            ConsumedCapacity: {
                CapacityUnits: 1,
            }
        };

        const validateParams = (params) => {
            // TODO validate input
        };

        const transactionLoaderHandler = new TransactionLoaderHandler(new DynamoDbMock(validateParams, expectedResult));

        return expect(transactionLoaderHandler.processEvent(detail)).to.eventually.be.fulfilled;
    });
});