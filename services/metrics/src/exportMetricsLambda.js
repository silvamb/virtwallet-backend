const AWS = require('aws-sdk');
const exportMetrics = require('./exportMetricsHandler').exportMetrics;
const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();

exports.handle = async event => {
    
    try {
        console.log("Export metrics event", event)

        const data = await exportMetrics(event, dynamodb, s3);
        return new ExportMetricsResponse(data);
    } catch(err) {
        console.log(err);
        return new ExportMetricsResponse({message: err.message}, 500);
    }
};

class ExportMetricsResponse {
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