const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const accountChangeSetHandler = require("../src/accountChangeSetHandler");
const testValues = require('./testValues');
const DynamoDbMock = testValues.DynamoDbMock;

describe("AccountChangeSet unit tests", () => {
    describe("save change set tests", () => {
        it("should save a change set in the database with success", () => {
            const validatePutItemParams = (params) => {
                expect(params.Item.PK.S).to.be.equal(`ACCOUNT#${testValues.ACCOUNT_ID}`);
                expect(params.Item.SK.S).to.be.equal("VERSION#10");
                expect(params.Item.changeSet.S).to.be.equal(JSON.stringify(testValues.expectedChangeSet));
            };

            const dynamoDbMock = new DynamoDbMock([validatePutItemParams], [testValues.putItemResult]);

            const promise = accountChangeSetHandler.saveChangeSet(dynamoDbMock, testValues.createChangeSetEvent);

            return expect(promise).to.be.fulfilled;
        });
    });
});