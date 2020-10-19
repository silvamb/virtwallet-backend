const AWS = require('aws-sdk');
const retrieveMetrics = require('./retrieveMetricsHandler').retrieveMetrics;
const dynamodb = new AWS.DynamoDB();

exports.handle = async event => {
    
    try {
        console.log("Retrieve metrics event", event)

        const data = await retrieveMetrics(dynamodb, event);
        return new RetrieveMetricsResponse(data);
    } catch(err) {
        console.log(err);
        return new RetrieveMetricsResponse({message: err.message}, 500);
    }
};

class RetrieveMetricsResponse {
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