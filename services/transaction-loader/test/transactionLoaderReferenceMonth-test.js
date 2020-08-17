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

class EventBridgeMock {

    putEvents(_params){

        return {
            promise: () => {
                return Promise.resolve(values.expectedPutEventResult);
            }
        }
    }
}

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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
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
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, expectedEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });
});