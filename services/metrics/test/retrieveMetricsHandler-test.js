const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const retrieveMetrics = require('../src/retrieveMetricsHandler').retrieveMetrics;
const testValues = require('./testValues');

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
describe('RetrieveMetricsHandler unit tests', () => {
    it('should retrieve all metrics for an account', () => {
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [testValues.singleResult]);

        const promise = retrieveMetrics(dynamoDbMock, testValues.getAccountMetricsEvent);

        return expect(promise).to.eventually.be.deep.equals([testValues.expectedMetric]);

    });

    it('should retrieve all metrics for an account and wallet', () => {
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#0001");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [testValues.singleResult]);

        const promise = retrieveMetrics(dynamoDbMock, testValues.getMetricsWithWalletEvent);

        return expect(promise).to.eventually.be.deep.equals([testValues.expectedMetric]);

    });

    it('should retrieve all metrics for an account and granularity', () => {
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#0001#Y");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [testValues.singleResult]);

        const promise = retrieveMetrics(dynamoDbMock, testValues.getMetricsWithWalletAndGranularityEvent);

        return expect(promise).to.eventually.be.deep.equals([testValues.expectedMetric]);

    });

    it('should retrieve all metrics for an account, wallet and date', () => {
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#0001#D#2019-12-19");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [testValues.singleResult]);

        const promise = retrieveMetrics(dynamoDbMock, testValues.getMetricsWithWalletAndDateEvent);

        return expect(promise).to.eventually.be.deep.equals([testValues.expectedMetric]);

    });

    it('should retrieve all metrics for an account, wallet, date and category', () => {
        const queryParamsValidator = (params) => {
            expect(params.ExpressionAttributeValues[":pk"].S).to.be.equals(`ACCOUNT#${testValues.ACCOUNT_ID}`);
            expect(params.ExpressionAttributeValues[":sk"].S).to.be.equals("METRIC#0001#D#2019-12-19#01");
            expect(params.KeyConditionExpression).to.be.equals("PK = :pk AND begins_with(SK, :sk)");
        };

        const dynamoDbMock = new DynamoDbMock(queryParamsValidator, [testValues.singleResult]);

        const promise = retrieveMetrics(dynamoDbMock, testValues.getMetricsWithWalletDateAndCategoryEvent);

        return expect(promise).to.eventually.be.deep.equals([testValues.expectedMetric]);

    });
});