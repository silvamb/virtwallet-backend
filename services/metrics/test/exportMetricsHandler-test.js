const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const exportMetrics = require('../src/exportMetricsHandler').exportMetrics;
const testValues = require('./testValues');
const DynamoDbMock = testValues.DynamoDbMock;
const S3Mock = testValues.S3Mock;
process.env.ACCOUNT_FILES_BUCKET = "s3Bucket";

describe('ExportMetricsHandler unit tests', () => {
    it('should retrieve all metrics for an account and export to S3', () => {
        const regexp = new RegExp(`account-data/${testValues.ACCOUNT_ID}/metrics_data_\\d{17}Z.csv`);

        const metricsQueryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const categoryQueryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("CATEGORY#");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(
            [metricsQueryParamsValidator, categoryQueryParamsValidator],
            [testValues.singleResult, testValues.categoryQueryResult]
        );

        const s3ParamsValidator = (params) => {
            expect(params.Bucket).to.be.equals("s3Bucket")
            expect(params.Key).to.match(regexp);
            expect(params.ContentType).to.be.equals("text/csv");
            expect(params.StorageClass).to.be.equals("ONEZONE_IA");
            expect(params.Body).to.be.equals(testValues.csvResult);
        }
        const s3Mock = new S3Mock(s3ParamsValidator, [{"VersionId": "0"}]);

        const promise = exportMetrics(testValues.getAccountMetricsEvent, dynamoDbMock, s3Mock);

        return expect(promise).to.eventually.match(regexp);

    });
});