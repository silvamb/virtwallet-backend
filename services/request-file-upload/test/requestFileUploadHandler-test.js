const chai = require("chai");
const expect = chai.expect;

const requestFileUploadHandler = require('../src/requestFileUploadHandler');
const S3FileHandler = requestFileUploadHandler.S3FileHandler;
const CreateFileUrlParameters = requestFileUploadHandler.CreateFileUrlParameters;

describe('RequestFileUploadHandlerTest', () => {
    it('should get a pre signed url with success', () => {

        const expectedBucket = "MYBUCKET";

        const createFileParams = new CreateFileUrlParameters();
        createFileParams.clientId = "ef471999-eb8f-5bc5-b39d-037e99f341c4";
        createFileParams.bucket = expectedBucket;
        createFileParams.accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";
        createFileParams.walletId = "0001";
        createFileParams.parserId = "ulster_csv";
        createFileParams.fileName = "myFile.csv";

        const expectedParams = {
            Bucket: expectedBucket,
            Key: "account-files/4801b837-18c0-4277-98e9-ba57130edeb3/0001/parsers/ulster_csv/myFile.csv",
            ContentType: "text/csv",
            StorageClass: "ONEZONE_IA",
            Metadata: {
                clientId: "ef471999-eb8f-5bc5-b39d-037e99f341c4"
            }
        };

        const s3Mock = {
            getSignedUrl: (operation, params) => {
                expect(operation).to.be.equal("putObject");
                expect(params).to.be.deep.equal(expectedParams);

                return "myUrl";
            }
        };

        const s3FileHandler = new S3FileHandler(s3Mock);
        const url = s3FileHandler.createFileUrl(createFileParams);
        expect(url).to.be.equal("myUrl");
    });
});