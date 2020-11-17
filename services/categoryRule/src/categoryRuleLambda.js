const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB();
const eventBridge = new AWS.EventBridge();
const categoryRuleHandler = require('./categoryRuleHandler');

exports.handle = async event => {
    
    console.log(event);

    try {
        const data = await categoryRuleHandler.handle(event, dynamoDB, eventBridge);
        return new Response(data);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

class Response {
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