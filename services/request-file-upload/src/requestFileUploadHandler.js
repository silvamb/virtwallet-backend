
class S3FileHandler {

    constructor(s3Client) {
        this.s3Client = s3Client;
    }


    createFileUrl(params) {
        const s3Key = `account-files/${params.accountId}/${params.walletId}/parsers/${params.parserId}/${params.fileName}`;

        const s3Params = {
            Bucket: params.bucket,
            Key: s3Key,
            ContentType: "text/csv",
            StorageClass: "ONEZONE_IA",
            Metadata: {
                clientId: params.clientId
            }
        };

        console.log("Creating signed URL with params", s3Params);

        const url = this.s3Client.getSignedUrl('putObject', s3Params);
        console.log('URL generated ', url);

        return url;
    }

}

class CreateFileUrlParameters {
    constructor() {
        this.clientId = "";
        this.bucket = "";
        this.accountId = "";
        this.walletId = "";
        this.parserId = "";
        this.fileName = "";
    }
}

exports.CreateFileUrlParameters = CreateFileUrlParameters;
exports.S3FileHandler = S3FileHandler;