const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const dataExporterHandler = require('../src/dataExportHandler');
const testValues = require('./testValues');

process.env.ACCOUNT_FILES_BUCKET = "s3Bucket";

class S3Mock {

    constructor(paramsValidator, returnValues = []) {
        this.paramsValidator = paramsValidator;
        this.returnValues = returnValues.reverse();
    }
    
    putObject(params) {
        this.paramsValidator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}

class DynamoDbMock {

    constructor(paramsValidator, returnValues = []) {
        this.paramsValidator = paramsValidator;
        this.returnValues = returnValues.reverse();
    }
    
    query(params) {
        this.paramsValidator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}

describe('DataExporterHandlerTest', () => {
    it('should export data to S3', () => {
        const regexp = new RegExp(`account-data/${testValues.accountId}/account_data_\\d{17}Z.json`);
        const event = testValues.event;
        
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.deep.equals(`ACCOUNT#${testValues.accountId}`);
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk");
        };

        const result = testValues.singleResult;

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [result]);

        const s3ParamsValidator = (params) => {
            expect(params.Bucket).to.be.equals("s3Bucket")
            expect(params.Key).to.match(regexp);
            expect(params.ContentType).to.be.equals("application/json");
            expect(params.StorageClass).to.be.equals("ONEZONE_IA");
            expect(params.Body).to.be.equals(JSON.stringify(result));
        }

        const s3Mock = new S3Mock(s3ParamsValidator, [{"VersionId": "0"}]);

        const promise = dataExporterHandler.handle(event, dynamoDbMock, s3Mock);

        return expect(promise).to.eventually.match(regexp);
    });
});