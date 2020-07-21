const AWS = require('aws-sdk');
const requestFileUploadHandler = require('./requestFileUploadHandler');
const S3FileHandler = requestFileUploadHandler.S3FileHandler;
const CreateFileUrlParameters = requestFileUploadHandler.CreateFileUrlParameters;
const s3FileHandler = new S3FileHandler(new AWS.S3());

exports.handle = async event => {
    
    console.log(event);

    // TODO validate parameters
    
    const params = new CreateFileUrlParameters();
    params.clientId = event.requestContext.authorizer.claims.aud;
    params.bucket = process.env.ACCOUNT_FILES_BUCKET;
    params.accountId = event.pathParameters.accountId;
    params.walletId = event.pathParameters.walletId;
    params.parserId = event.pathParameters.parserId;
    params.fileName = event.queryStringParameters.fileName;

    const url = s3FileHandler.createFileUrl(params);

    return new Response(url);
}

// TODO Extract to a utility function
class Response {
    constructor(data, statusCode = 200){
        this.statusCode = statusCode;
        this.body = JSON.stringify(data);

        if(process.env.CORS_ENABLED) {
            this.headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            };
        }
    }
}