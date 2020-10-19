const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const FileRouter = require('../src/fileRouterHandler').FileRouter;

describe('FileRouterUnitTests', () => {
    it('should enqueue a file parse request with success', () => {

        const expectedResult = {
            FailedEntryCount: 0, 
            Entries: [{
                EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
            }]
        };

        const eventBridgeMock = {
            putEvents: (params) => {
                expect(params.Entries[0].Source).to.be.equal("virtwallet");
                expect(params.Entries[0].DetailType).to.be.equal("file ready to parse");
                
                const detail = JSON.parse(params.Entries[0].Detail);
                expect(detail.account).to.be.equal("a03af6a8-e246-410a-8ca5-bfab980648cc");
                expect(detail.wallet).to.be.equal("0001");
                expect(detail.parserName).to.be.equal("ulster_csv_parser");
                expect(detail.fileName).to.be.equal("myfile.csv");
                expect(detail.bucketName).to.be.equal("my-bucket");
                expect(detail.objectKey).to.be.equal("account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv");

                return {
                    promise: () => {
                        return Promise.resolve(expectedResult);
                    }
                }
            }
        };

        const fileRouter  = new FileRouter(eventBridgeMock);

        const record = {
            s3: {
                bucket: {
                    name: "my-bucket"
                },
                object: {
                    key: "account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv"
                }
            }
        }

        return expect(fileRouter.publishEvent(record)).to.eventually.become(expectedResult);
    });
});