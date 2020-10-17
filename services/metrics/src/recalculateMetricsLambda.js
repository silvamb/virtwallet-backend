const AWS = require('aws-sdk');
const { recalculateMetrics } = require('./metricsUpdateHandler');
const dynamodb = new AWS.DynamoDB();

exports.handle = async event => {
    
    try {
        console.log("Recalculate metrics event", event)

        const data = await recalculateMetrics(dynamodb, event);
        return new RecalculateMetricsResponse(data);
    } catch(err) {
        console.log(err);
        return new RecalculateMetricsResponse({message: err.message}, 500);
    }
};

class RecalculateMetricsResponse {
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