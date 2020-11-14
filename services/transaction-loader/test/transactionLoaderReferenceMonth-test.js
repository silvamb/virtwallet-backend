const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { processEvent } = require('../src/transactionLoaderHandler');
const values = require('./testValues');

class DynamoDbMock  {

    setMock(functionName, {validateFunction = (_params) => undefined, expectedResult}) {

        this[functionName] = (params) => {
            validateFunction(params);

            return {
                promise: () => {
                    return Promise.resolve(Object.assign({}, expectedResult));
                }
            }
        }

        return this;
    }

};

const EventBridgeMock = values.EventBridgeMock;

const validateEvent = (params) => {
    expect(params.Entries[0].Source).to.be.equal("virtwallet");
    expect(params.Entries[0].DetailType).to.be.equal("transactions created");
}

const validatePutVersionEventParams = (params) => {
    expect(params.Entries[0].Source).to.be.equal(values.createSingleTransactionUpdateVersionEvent.Source);
    expect(params.Entries[0].DetailType).to.be.equal(values.createSingleTransactionUpdateVersionEvent.DetailType);
};

const validateUpdateVersionParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${values.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
};

describe('Reference Month Date unit tests', () => {
    it('should set current month when currentMonth is true and the date is after start date', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-08-05';
        
        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-08');
        }
        
        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: values.expectedAccountWithStartDate})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set previous month when currentMonth is true and the date is before the start date', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-08-04';
        
        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-07');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccountWithStartDate)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set next month when currentMonth is false and the date is after the start date', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-07-29';
        
        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-08');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set current month when currentMonth is false and the date is before the start date', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-08-05';
        
        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-08');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });//

    it('should set the month when a date is between a manually inserted period', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2019-12-23';

        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-01');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccountWithManuallySetStartDate)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set the month when a date is in the first day of a manually inserted period', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2019-12-20';

        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-01');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccountWithManuallySetStartDate)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set the month when a date is the last day of a manually inserted period', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-01-23';

        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-01');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccountWithManuallySetStartDate)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should set the month when a date is after a manually inserted period', () => {
        const expectedEvent = Object.assign({}, values.singleTransactionsEvent);
        expectedEvent.transactions = expectedEvent.transactions.slice();
        expectedEvent.transactions[0].txDate = '2020-01-24';

        const validateFunction = (params) => {
            expect(params.Item.referenceMonth.S).to.be.equals('2020-02');
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccountWithManuallySetStartDate)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });
});