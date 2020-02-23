const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const WalletHandler = require('../src/walletHandler').WalletHandler;

class DynamoDbMock  {

    setMock(functionName, validateFunction = () => true, expectedResult = {ConsumedCapacity: 1}) {

        this[functionName] = (params) => {
            validateFunction(params);

            return {
                promise: () => {
                    return Promise.resolve(expectedResult);
                }
            }
        }

        return this;
    }

};

describe('WalletHandler unit tests', () => {
    describe('create wallet tests', () => {
        it('should create wallet with success', () => {

            // TODO Add this to a JSON file
            const eventBody = {
                name: "Wallet Name",
                description: "Wallet Description",
                type: "checking_account"
            };

            // TODO Add this to a JSON file
            const event = {
                httpMethod: 'POST',
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: "10v21l6b17g3t27sfbe38b0i8n"
                        }
                    }
                },
                pathParameters: {
                    accountId: "4801b837-18c0-4277-98e9-ba57130edeb3"
                },
                body: JSON.stringify(eventBody)
            };

            const expectedQueryParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("WALLET#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
            };

            const expectedQueryResult = {
                Count: 1,
                ScannedCount: 1
            };

            const expectedCreationParams = (params) => {
                expect(params.Item.ownerId.S).to.be.equal("10v21l6b17g3t27sfbe38b0i8n");
                expect(params.Item.accountId.S).to.be.equal("4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.Item.type.S).to.be.equal("checking_account");
                expect(params.Item.name.S).to.be.equal("Wallet Name");
                expect(params.Item.description.S).to.be.equal("Wallet Description");
            };

            const dynamoDbMock = new DynamoDbMock()
                .setMock('query', expectedQueryParams, expectedQueryResult)
                .setMock('putItem', expectedCreationParams);

            const walletHandler = new WalletHandler(dynamoDbMock);
            const promise = walletHandler.create(event);
            return Promise.all([
                expect(promise).to.eventually.has.property("ownerId", "10v21l6b17g3t27sfbe38b0i8n"),
                expect(promise).to.eventually.has.property("accountId", "4801b837-18c0-4277-98e9-ba57130edeb3"),
                expect(promise).to.eventually.has.property("walletId", "0002"),
                expect(promise).to.eventually.has.property("type", "checking_account"),
                expect(promise).to.eventually.has.property("name", "Wallet Name"),
                expect(promise).to.eventually.has.property("description", "Wallet Description")
            ]);
        });
    });

    describe('list wallet test', () => {
        it('should list wallets from an user', () => {

            // TODO Add this to a JSON file
            const event = {
                httpMethod: 'GET',
                requestContext: {
                    authorizer: {
                        claims: {
                            client_id: "10v21l6b17g3t27sfbe38b0i8n"
                        }
                    }
                },
                pathParameters: {
                    accountId: "4801b837-18c0-4277-98e9-ba57130edeb3"
                }
            };

            const validateParams = (params) => {
                expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                expect(params.KeyConditionExpression).to.be.equal("PK = :pk");
            };

            // TODO Add this to a JSON file
            const expectedResult = {
                Count: 1,
                Items: [
                    {
                        PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
                        SK: {"S": "WALLET#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
                        accountId:  {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
                        walletId:  {"S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
                        ownerId:  {"S": "10v21l6b17g3t27sfbe38b0i8n"},
                        type: {"S": "checking_account"},
                        name: {"S": "Wallet Name"},
                        description: {"S": "Wallet Description"}
                    }
                ],
                ScannedCount: 1
            };

            const dynamoDbMock = new DynamoDbMock().setMock('query', validateParams, expectedResult);

            const walletHandler = new WalletHandler(dynamoDbMock);
            const promise = walletHandler.list(event);

            // TODO Add this to a JSON file
            const expectedList = {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f",
                ownerId: "10v21l6b17g3t27sfbe38b0i8n",
                type: "checking_account",
                name: "Wallet Name",
                description: "Wallet Description"
            };

            return expect(promise).to.eventually.deep.include(expectedList);
        });
    });

    it('should get an wallet from an user', () => {

        // TODO Add this to a JSON file
        const event = {
            httpMethod: 'GET',
            requestContext: {
                authorizer: {
                    claims: {
                        client_id: "10v21l6b17g3t27sfbe38b0i8n"
                    }
                }
            },
            pathParameters: {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f",
            }
        };

        const validateParams = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("WALLET#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f");
            expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK =:sk");
        };

        // TODO Add this to a JSON file
        const expectedResult = {
            Count: 1,
            Items: [
                {
                    PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
                    SK: {"S": "WALLET#4801b837-18c0-4277-98e9-ba57130edeb3#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
                    accountId:  {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
                    walletId:  {"S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
                    ownerId:  {"S": "10v21l6b17g3t27sfbe38b0i8n"},
                    type: {"S": "checking_account"},
                    name: {"S": "Wallet Name"},
                    description: {"S": "Wallet Description"}
                }
            ],
            ScannedCount: 1
        };

        const dynamoDbMock = new DynamoDbMock().setMock('query', validateParams, expectedResult);

        const walletHandler = new WalletHandler(dynamoDbMock);
        const promise = walletHandler.get(event);

        // TODO Add this to a JSON file
        const expectedWallet = {
            accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
            walletId: "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f",
            ownerId: "10v21l6b17g3t27sfbe38b0i8n",
            type: "checking_account",
            name: "Wallet Name",
            description: "Wallet Description"
        };

        return expect(promise).to.eventually.become(expectedWallet);
    });
});