const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');

const parser = require('../src/ulsterStatementCsvParser');
const { on } = require("process");

const CsvParser = parser.UlsterCsvParser;

describe('UlsterStatementCsvParserTest', () => {
    it('should parse file with success', () => {
        const fileStream = fs.createReadStream('./test/csv/ACCOUNTNAME12345678-20200105.csv');
        const expectedBucket = "someS3Bucket";
        const expectedKey = "s3Key";


        const s3Mock = {
            getObject: (s3Params) => {
                expect(s3Params.Bucket).to.be.equals(expectedBucket);
                expect(s3Params.Key).to.be.equals(expectedKey);

                return {
                    createReadStream: () => fileStream,
                    on: (_event, callback) => callback(200, {'x-amz-meta-clientid': '7b91u3i7qne31cbj1gh5zd9qcj'}) 
                }
            }
        };

        const parser = new CsvParser(s3Mock);

        const promise = parser.parseCsvFile(expectedBucket, expectedKey);
        return expect(promise).to.be.eventually.fulfilled;
    });
});