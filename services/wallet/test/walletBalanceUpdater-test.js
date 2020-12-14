const { version } = require("chai");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { updateBalance } = require('../src/walletBalanceUpdater');
const testValues = require('./testValues');
const walletBalanceUpdateTestValues = require('./walletBalanceUpdateTestValues');

const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateVersionUpdateItemParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version");
};


describe('WalletBalanceUpdater unit tests', () => {
    it('should update the balance after creating transactions', () => {
        const validateUpdateWalletParams = (params) => {
            const expectedParams = walletBalanceUpdateTestValues.updateWalletBalanceParams;
            expect(params.ExpressionAttributeNames).to.be.deep.equals(expectedParams.ExpressionAttributeNames);
            expect(params.ExpressionAttributeValues).to.be.deep.equals(expectedParams.ExpressionAttributeValues);
            expect(params.Key).to.be.deep.equals(expectedParams.Key);
            expect(params.UpdateExpression).to.be.deep.equals(expectedParams.UpdateExpression);
        };

        const dbValidators = [validateUpdateWalletParams, validateVersionUpdateItemParams];
        const dbReturnValues = [testValues.updateWalletBalanceResult, testValues.versionUpdateResult];

        const dynamoDbMock = new DynamoDbMock(dbValidators, dbReturnValues);

        const validatePutVersionEventParams = (params) => {
            expect(params.Entries[0].Source).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Source);
            expect(params.Entries[0].DetailType).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.DetailType);
            expect(params.Entries[0].Detail).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Detail);
        };

        const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);

        const promise = updateBalance(dynamoDbMock, eventBridgeMock, walletBalanceUpdateTestValues.transactionsCreatedEvent);

        const expectedResult = {
            data: walletBalanceUpdateTestValues.expectedUpdatedWallet
        };

        return expect(promise).to.eventually.become(expectedResult);
    });

    it('should update wallet balance after a single transaction updated', () => {
        const validateUpdateWalletParams = (params) => {
            const expectedParams = walletBalanceUpdateTestValues.updateWalletBalanceParams;
            expect(params.ExpressionAttributeNames).to.be.deep.equals(expectedParams.ExpressionAttributeNames);
            expect(params.ExpressionAttributeValues).to.be.deep.equals(expectedParams.ExpressionAttributeValues);
            expect(params.Key).to.be.deep.equals(expectedParams.Key);
            expect(params.UpdateExpression).to.be.deep.equals(expectedParams.UpdateExpression);
        };

        const dbValidators = [validateUpdateWalletParams, validateVersionUpdateItemParams];
        const dbReturnValues = [testValues.updateWalletBalanceResult, testValues.versionUpdateResult];

        const dynamoDbMock = new DynamoDbMock(dbValidators, dbReturnValues);

        const validatePutVersionEventParams = (params) => {
            expect(params.Entries[0].Source).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Source);
            expect(params.Entries[0].DetailType).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.DetailType);
            expect(params.Entries[0].Detail).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Detail);
        };

        const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);

        const promise = updateBalance(dynamoDbMock, eventBridgeMock, walletBalanceUpdateTestValues.transactionUpdateEvent);

        const expectedResult = {
            data: walletBalanceUpdateTestValues.expectedUpdatedWallet
        };

        return expect(promise).to.eventually.become(expectedResult);
    });

    it('should update wallet balance after 3 transactions been updated', () => {
        const validateUpdateWalletParams = (params) => {
            const expectedParams = walletBalanceUpdateTestValues.updateWalletBalanceParams;
            expect(params.ExpressionAttributeNames).to.be.deep.equals(expectedParams.ExpressionAttributeNames);
            expect(params.ExpressionAttributeValues).to.be.deep.equals(expectedParams.ExpressionAttributeValues);
            expect(params.Key).to.be.deep.equals(expectedParams.Key);
            expect(params.UpdateExpression).to.be.deep.equals(expectedParams.UpdateExpression);
        };

        const dbValidators = [validateUpdateWalletParams, validateVersionUpdateItemParams];
        const dbReturnValues = [testValues.updateWalletBalanceResult, testValues.versionUpdateResult];

        const dynamoDbMock = new DynamoDbMock(dbValidators, dbReturnValues);

        const validatePutVersionEventParams = (params) => {
            expect(params.Entries[0].Source).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Source);
            expect(params.Entries[0].DetailType).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.DetailType);
            expect(params.Entries[0].Detail).to.be.equal(walletBalanceUpdateTestValues.walletUpdatedEvent.Detail);
        };

        const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);

        const promise = updateBalance(dynamoDbMock, eventBridgeMock, walletBalanceUpdateTestValues.transactionsUpdateEvent);

        const expectedResult = {
            data: walletBalanceUpdateTestValues.expectedUpdatedWallet
        };

        return expect(promise).to.eventually.become(expectedResult);
    });
});