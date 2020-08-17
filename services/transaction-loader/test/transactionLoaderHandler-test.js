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
    constructor(expectedTransactions) {
        this.expectedTransactions = expectedTransactions;
    }

    putEvents(params){
        expect(params.Entries[0].Source).to.be.equal("virtwallet");
        expect(params.Entries[0].DetailType).to.be.equal("transactions created");
        const detail = JSON.parse(params.Entries[0].Detail);
        expect(detail).to.be.deep.equals(this.expectedTransactions);

        return {
            promise: () => {
                return Promise.resolve(values.expectedPutEventResult);
            }
        }
    }
}

describe('TransactionLoaderHandler unit tests', () => {
    it('should process single transaction with success', () => {
        const validateFunction = (params) => {
            for(let attr in values.putItemParamsForTx1.Item) {
                for(let value in attr) {
                    const expectedValue = values.putItemParamsForTx1.Item[attr][value];
                    expect(params.Item[attr][value]).to.be.equal(expectedValue);
                }
            }
            expect(params.ReturnConsumedCapacity).to.be.equals(values.putItemParamsForTx1.ReturnConsumedCapacity);
            expect(params.TableName).to.be.equals(values.putItemParamsForTx1.TableName);
            expect(params.ReturnValues).to.be.equals(values.putItemParamsForTx1.ReturnValues);
            expect(params.ConditionExpression).to.be.equals(values.putItemParamsForTx1.ConditionExpression);
        }
        console.log(">>>>>>>>>> values.expectedAccount", values.expectedAccount);
        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', { validateFunction });

        const eventBridgeMock = new EventBridgeMock(values.singleTransactionsCreatedEvent);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, values.singleTransactionsEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should process two transactions with success', () => {
        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', {});
        console.log(">>>>>>>>>> values.expectedAccount", values.expectedAccount);
        const eventBridgeMock = new EventBridgeMock(values.multiTransactionsCreatedEvent);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, values.multiTransactionsEvent);
        return expect(promise).to.eventually.be.fulfilled;
    });
});