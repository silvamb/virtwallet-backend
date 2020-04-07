const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const ulsterCsvParserHandler = require('../src/ulsterStatementCsvParserHandler');

const UlsterStatementCsvParserHandler = ulsterCsvParserHandler.UlsterCsvParserHandler;

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

        const expectedResult = {
            FailedEntryCount: 0, 
            Entries: [{
                EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
            }]
        };

        const eventBridgeMock = {
            putEvents: (params) => {
                expect(params.Entries[0].Source).to.be.equal("virtwallet");
                expect(params.Entries[0].DetailType).to.be.equal("transactions parsed");
                const detail = JSON.parse(params.Entries[0].Detail);
                expect(detail.account).to.be.equal("33e9f5c3-c1a7-4dc7-be21-e144b2f5a53c");
                expect(detail.wallet).to.be.equal("0001");
                expect(detail.parserName).to.be.equal("ulster_csv");
                expect(detail.fileName).to.be.equal("file.csv");
                expect(detail.bucketName).to.be.equal("someS3Bucket");
                expect(detail.objectKey).to.be.equal("s3Key");
                expect(detail.transactions.length).to.be.equal(8);

                return {
                    promise: () => {
                        return Promise.resolve(expectedResult);
                    }
                }
            }
        };

        const handler = new UlsterStatementCsvParserHandler(s3Mock, eventBridgeMock);

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