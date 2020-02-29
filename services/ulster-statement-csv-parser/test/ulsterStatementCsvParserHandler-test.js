const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const ulsterCsvParserHandler = require('../src/ulsterStatementCsvParserHandler');

const UlsterStatementCsvParserHandler = ulsterCsvParserHandler.UlsterCsvParserHandler;

process.env.transaction_queue_url = "arn:aws:sqs:us-east-1:123456789:myqueue";

describe('UlsterStatementCsvParserHandlerTest', () => {
    it('should parse file with success', () => {
        const fileStream = fs.createReadStream('./test/csv/ACCOUNTNAME12345678-20200105.csv');
        const expectedBucket = "someS3Bucket";
        const expectedKey = "s3Key";


        const s3Mock = {
            getObject: (s3Params) => {
                expect(s3Params.Bucket).to.be.equals(expectedBucket);
                expect(s3Params.Key).to.be.equals(expectedKey);

                return {
                    createReadStream: () => fileStream
                }
            }
        };

        const sqsMock = {
            sendMessage: (params) => {
                return {
                    promise: () => {
                        return Promise.resolve({
                            ResponseMetadata: { RequestId: '8cc461be-b2ce-5dae-b50f-121339d04406' },
                            MD5OfMessageBody: 'b7df356e84c341d0a5d829e2bb3612b3',
                            MessageId: '33e9f5c3-c1a7-4dc7-be21-e144b2f5a53c'
                          });
                    }
                }
            }
        };

        const handler = new UlsterStatementCsvParserHandler(s3Mock, sqsMock);

        const message = {
            account: '33e9f5c3-c1a7-4dc7-be21-e144b2f5a53c',
            wallet: '0001',
            parserName: 'ulster_csv',
            fileName: 'file.csv',
            bucketName: 'someS3Bucket',
            objectKey: 's3Key'
        };

        const promise = handler.handle(message);
        return expect(promise).to.be.eventually.fulfilled;
    });
});