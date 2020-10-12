const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const transactionExporterHandler = require('../src/transactionExporterHandler');

const expectedBucket = "myBucket";
process.env.ACCOUNT_FILES_BUCKET = expectedBucket;

describe('TransactionExporterHandlerTest', () => {
    it('should export transactions to CSV format', () => {
        const event = {
            httpMethod: "GET",
            requestContext: {
                requestTimeEpoch: 1589226971123
            },
            queryStringParameters:{
                from: "2020-02-25",
                to: "2020-03-24"
            },
            pathParameters: {
                accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
                walletId: "0001"
            }
        };

        const dynamoDbMock = {
            query: params => {
                let expectedResult;
                if(params.ExpressionAttributeValues[":sk"]) {
                    expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                    expect(params.ExpressionAttributeValues[":sk"].S).to.be.equal("CATEGORY#");
                    expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND begins_with(SK, :sk)");
                    expectedResult = {
                        Count: 1,
                        Items: [
                            {
                                PK: {
                                    S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3",
                                },
                                SK: { S: "CATEGORY#01" },
                                accountId: {
                                    S: "4801b837-18c0-4277-98e9-ba57130edeb3",
                                },
                                categoryId: { S: "01" },
                                name: { S: "Category Name" },
                                description: { S: "Category Description" },
                            },
                        ],
                        ScannedCount: 1,
                    };
                } else {
                    expect(params.ExpressionAttributeValues[":pk"].S).to.be.equal("ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3");
                    expect(params.ExpressionAttributeValues[":sk_start"].S).to.be.equal("TX#0001#2020-02-25");
                    expect(params.ExpressionAttributeValues[":sk_end"].S).to.be.equal("TX#0001#2020-03-24");
                    expect(params.KeyConditionExpression).to.be.equal("PK = :pk AND SK BETWEEN :sk_start AND :sk_end");

                    expectedResult = {
                        Count: 1,
                        Items: [
                            {
                                PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
                                SK: { "S": "TX#0001#2020-01-01#202001010001" },
                                accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
                                walletId: { "S": "0001" },
                                txDate: { "S": "2020-03-01" },
                                txId: { "S": "202003010001" },
                                dt: { "S": "2020-03-01T00:00:00.000Z" },
                                value: { "N": "19.9" },
                                description: { "S": "Transaction, Test" },
                                type: { "S": "POS" },
                                balance: { "N": "1234.56" },
                                balanceType: { "S": "Debit" },
                                includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
                                version: { "N": 1 },
                                categoryId: { "S": "01"},
                                keyword: { "S": "Transaction"},
                                source: { "S": "JOHNDOE12345678-20200107.csv"},
                                sourceType: {"S": "A"},
                                referenceMonth: {"S": "2020-03"}
                            }
                        ],
                        ScannedCount: 1
                    };
                }

                return {
                    promise: () => {
                        return Promise.resolve(expectedResult);
                    }
                }
            }    
        };

        const expectedS3Key = "export-files/4801b837-18c0-4277-98e9-ba57130edeb3/0001/transactions_2020-02-25_to_2020-03-24_1589226971123.csv"

        const getSignedUrlParams = {
            Bucket: expectedBucket,
            Key: expectedS3Key
        };

        const expectedUrl = "myUrl";
        const expectedCsv = fs.readFileSync('./test/files/expected.csv').toString();

        const putObjectParams = {
            Bucket: expectedBucket,
            Key: expectedS3Key,
            ContentType: "text/csv",
            StorageClass: "ONEZONE_IA",
            Body: expectedCsv
        };

        const s3Mock = {
            
            putObject: params => {
                expect(params).to.be.deep.equal(putObjectParams);

                return {
                    promise: () => {
                        return Promise.resolve({"VersionId": "0"});
                    }
                }
            },
            getSignedUrl: (operation, params) => {
                expect(operation).to.be.equal("getObject");
                expect(params).to.be.deep.equal(getSignedUrlParams);

                return expectedUrl;
            }
        }

        const promise = transactionExporterHandler.handle(event, dynamoDbMock, s3Mock);
        return expect(promise).to.eventually.become(expectedUrl);
    });
});