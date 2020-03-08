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

    putItem(_params) {

        return {
            promise: () => {
                return Promise.resolve({ScannedItems: 1});
            }
        }
    }
};

describe('TransactionLoaderHandler unit tests', () => {
    it('should process records with success', () => {
        const messageBody = {
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

        const record = {
            messageId: 1,
            body: JSON.stringify(messageBody)
        }

        const transactionLoaderHandler = new TransactionLoaderHandler(new DynamoDbMock());

        return expect(transactionLoaderHandler.processRecord(record)).to.eventually.be.fulfilled;
    });
});