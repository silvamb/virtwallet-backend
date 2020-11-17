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

const validateUpdateVersionParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${values.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version ");
};


describe('TransactionLoaderHandler unit tests', () => {
    it('should process single transaction with success', () => {
        const validateFunction = (params) => {
            expect(params.ReturnConsumedCapacity).to.be.equals(values.putItemParamsForTx1.ReturnConsumedCapacity);
            expect(params.TableName).to.be.equals(values.putItemParamsForTx1.TableName);
            expect(params.ReturnValues).to.be.equals(values.putItemParamsForTx1.ReturnValues);
            expect(params.ConditionExpression).to.be.equals(values.putItemParamsForTx1.ConditionExpression);
        }

        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', { validateFunction })
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const validateEvent = (params) => {
            expect(params.Entries[0].Source).to.be.equal("virtwallet");
            expect(params.Entries[0].DetailType).to.be.equal("transactions created");
            const detail = JSON.parse(params.Entries[0].Detail);
            expect(detail).to.be.deep.equals(values.singleTransactionsCreatedEvent);
        }

        const validatePutVersionEventParams = (params) => {
            expect(params.Entries[0].Source).to.be.equal(values.createSingleTransactionUpdateVersionEvent.Source);
            expect(params.Entries[0].DetailType).to.be.equal(values.createSingleTransactionUpdateVersionEvent.DetailType);
            expect(params.Entries[0].Detail).to.be.equal(values.createSingleTransactionUpdateVersionEvent.Detail);
        };

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, values.singleTransactionsEvent);

        return expect(promise).to.eventually.be.fulfilled;
    });

    it('should process two transactions with success', () => {
        const dynamoDbMock = new DynamoDbMock()
            .setMock('query', {expectedResult: Object.assign({}, values.expectedAccount)})
            .setMock('putItem', {})
            .setMock('updateItem', { validateFunction: validateUpdateVersionParams, expectedResult: values.versionUpdateResult });

        const validateEvent = (params) => {
            expect(params.Entries[0].Source).to.be.equal("virtwallet");
            expect(params.Entries[0].DetailType).to.be.equal("transactions created");
            const detail = JSON.parse(params.Entries[0].Detail);
            expect(detail).to.be.deep.equals(values.multiTransactionsCreatedEvent);
        }

        const validatePutVersionEventParams = (params) => {
            expect(params.Entries[0].Source).to.be.equal(values.createMultipleTransactionUpdateVersionEvent.Source);
            expect(params.Entries[0].DetailType).to.be.equal(values.createMultipleTransactionUpdateVersionEvent.DetailType);
            expect(params.Entries[0].Detail).to.be.equal(values.createMultipleTransactionUpdateVersionEvent.Detail);
        };

        const eventBridgeMock = new EventBridgeMock([validateEvent, validatePutVersionEventParams]);
        const promise = processEvent(dynamoDbMock, eventBridgeMock, values.multiTransactionsEvent);
        return expect(promise).to.eventually.be.fulfilled;
    });
});