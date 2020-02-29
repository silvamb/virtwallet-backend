const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const FileRouter = require('../src/fileRouterHandler').FileRouter;

process.env.ulster_csv_parser = "arn:aws:sqs:us-east-1:123456789:myqueue";

describe('FileRouterUnitTests', () => {
    it('should enqueue a file parse request with success', () => {

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

        const fileRouter  = new FileRouter(sqsMock);

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

        return expect(fileRouter.routeToQueue(record)).to.eventually.be.fulfilled;
    });

    it('should thrown an error when the queue is not found', () => {
        const fileRouter  = new FileRouter();

        const record = {
            s3: {
                bucket: {
                    name: "my-bucket"
                },
                object: {
                    key: "account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/unsupported_parser/myfile.csv"
                }
            }
        };

        return expect(fileRouter.routeToQueue(record)).to.eventually.be.rejected;
    });
});