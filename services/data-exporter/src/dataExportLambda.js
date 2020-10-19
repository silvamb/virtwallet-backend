const AWS = require('aws-sdk');
const dataExportHandler = require('./dataExportHandler');

exports.handle = async event => {
    
    console.log("Init data export", event);

    try {
        const data = await dataExportHandler.handle(event, new AWS.DynamoDB(), new AWS.S3());
        return new ExportDataResponse(data);
    } catch(err) {
        return new ExportDataResponse({message: err.message}, 500);
    }
};

class ExportDataResponse {
    constructor(data, statusCode = 200){
        this.statusCode = statusCode;
        this.body = JSON.stringify(data);

        if(process.env.CORS_ALLOWED_ORIGIN) {
            this.headers = {
                'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN,
                'Access-Control-Allow-Credentials': true,
            };
        }
    }
}