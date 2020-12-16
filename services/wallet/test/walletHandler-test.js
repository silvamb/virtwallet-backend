const { version } = require("chai");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const WalletHandler = require('../src/walletHandler').WalletHandler;
const testValues = require('./testValues');

const DynamoDbMock = testValues.DynamoDbMock;
const EventBridgeMock = testValues.EventBridgeMock;

const validateVersionUpdateItemParams = (params) => {
    expect(params.Key.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
    expect(params.Key.SK.S).to.be.equal("METADATA");
    expect(params.ExpressionAttributeNames["#version"]).to.be.equals("version");
    expect(params.ExpressionAttributeValues[":version"].N).to.be.equals("1");
    expect(params.UpdateExpression).to.be.equals("ADD #version :version");
};

describe('WalletHandler unit tests', () => {
    describe('create wallet tests', () => {
        it('should create wallet with success', () => {
            const validateWalletQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("WALLET#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };
            const validateCreateWalletParams = (params) => {
                expect(params.Item.ownerId.S).to.be.equal(testValues.CLIENT_ID);
                expect(params.Item.accountId.S).to.be.equal(testValues.ACCOUNT_ID);
                expect(params.Item.type.S).to.be.equal("checking_account");
                expect(params.Item.name.S).to.be.equal("Wallet Name");
                expect(params.Item.description.S).to.be.equal("Wallet Description");
                expect(params.Item.versionId.N).to.be.equal("1");
            };

            const dbValidators = [validateWalletQueryParams, validateCreateWalletParams, validateVersionUpdateItemParams];
            const dbReturnValues = [testValues.expectedListWalletsResult, testValues.putItemResult, testValues.versionUpdateResult];

            const dynamoDbMock = new DynamoDbMock(dbValidators, dbReturnValues);

            const validatePutVersionEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedNewWalletVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedNewWalletVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedNewWalletVersionEvent.Detail);
            };

            const eventBridgeMock = new EventBridgeMock([validatePutVersionEventParams]);

            const walletHandler = new WalletHandler(dynamoDbMock, eventBridgeMock);
            const promise = walletHandler.create(testValues.newWalletEvent);

            const expectedResult = {
                data: testValues.expectedWallet
            };

            return expect(promise).to.eventually.become(expectedResult);
        });
    });

    describe('list wallet test', () => {
        it('should list wallets from an user', () => {
            const validateListWalletParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("WALLET#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const dynamoDbMock = new DynamoDbMock([validateListWalletParams], [testValues.expectedListWalletsResult]);

            const walletHandler = new WalletHandler(dynamoDbMock);
            const promise = walletHandler.list(testValues.listWalletsEvent);

            return expect(promise).to.eventually.become([testValues.expectedWallet]);
        });
    });

    it('should get an wallet from an user', () => {

        const validateListWalletParams = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal(`WALLET#${testValues.ACCOUNT_ID}#${testValues.WALLET_ID}`);
            expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK =:sk");
        };


        const dynamoDbMock = new DynamoDbMock([validateListWalletParams], [testValues.expectedListWalletsResult]);

        const walletHandler = new WalletHandler(dynamoDbMock);
        const promise = walletHandler.get(testValues.getWalletsEvent);

        return expect(promise).to.eventually.become(testValues.expectedWallet);
    });

    describe("update wallet tests", () => {
        it("should update a wallet name and description", () => {
            const validateParams = params => {
                expect(params.Key.PK.S).to.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Key.SK.S).to.equals(`WALLET#${testValues.ACCOUNT_ID}#${testValues.WALLET_ID}`);
                expect(params.ExpressionAttributeNames["#name"]).to.be.equals("name");
                expect(params.ExpressionAttributeNames["#description"]).to.be.equals("description");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":name"].S).to.be.equals("newName");
                expect(params.ExpressionAttributeValues[":description"].S).to.be.equals("newDesc");
                expect(params.ExpressionAttributeValues[":old_name"].S).to.be.equals("oldName");
                expect(params.ExpressionAttributeValues[":old_description"].S).to.be.equals("oldDesc");
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #name = :name,#description = :description");
                expect(params.ConditionExpression).to.be.equals("#name = :old_name AND #description = :old_description");
            }

            const validators = [validateParams, validateVersionUpdateItemParams];

            const expectedDbResults = [
                testValues.updateWalletResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateWalletVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateWalletVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateWalletVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const walletHandler = new WalletHandler(dynamoDbMock, eventBridgeMock);
            const promise = walletHandler.update(testValues.updateWalletEvent);

            promise.then(data => console.log(data));

            return expect(promise).to.eventually.haveOwnProperty('data');
        });

        it("should update a wallet balance", () => {
            const validateParams = params => {
                expect(params.Key.PK.S).to.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Key.SK.S).to.equals(`WALLET#${testValues.ACCOUNT_ID}#${testValues.WALLET_ID}`);
                expect(params.ExpressionAttributeNames["#balance"]).to.be.equals("balance");
                expect(params.ExpressionAttributeNames["#versionId"]).to.be.equals("versionId");
                expect(params.ExpressionAttributeValues[":balance"].N).to.be.equals("1234");
                expect(params.ExpressionAttributeValues[":old_balance"].N).to.be.equals("0");
                expect(params.ExpressionAttributeValues[":versionId"].N).to.be.equals("1");
                expect(params.UpdateExpression).to.be.equals("ADD #versionId :versionId SET #balance = :balance");
                expect(params.ConditionExpression).to.be.equals("#balance = :old_balance");
            }

            const validators = [validateParams, validateVersionUpdateItemParams];

            const expectedDbResults = [
                testValues.updateWalletBalanceResult,
                testValues.versionUpdateResult
            ];

            const dynamoDbMock = new DynamoDbMock(validators, expectedDbResults);

            const validatePutEventParams = (params) => {
                expect(params.Entries[0].Source).to.be.equal(testValues.expectedUpdateWalletVersionEvent.Source);
                expect(params.Entries[0].DetailType).to.be.equal(testValues.expectedUpdateWalletVersionEvent.DetailType);
                expect(params.Entries[0].Detail).to.be.equal(testValues.expectedUpdateWalletVersionEvent.Detail);
              }
              
            const eventBridgeMock = new EventBridgeMock([validatePutEventParams]);

            const walletHandler = new WalletHandler(dynamoDbMock, eventBridgeMock);
            const promise = walletHandler.update(testValues.updateWalletBalanceEvent);

            promise.then(data => console.log(data));

            return expect(promise).to.eventually.haveOwnProperty('data');
        });
    });
});