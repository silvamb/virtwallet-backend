const AWS = require('aws-sdk');
const categoryHandler = require('./categoryHandler');

exports.handle = async event => {
    console.log(event);

    try {
        const data = await categoryHandler.handle(event, new AWS.DynamoDB());
        return new Response(data);
    } catch(err) {
        console.log(err);
        return new Response({message: err.message}, 500);
    }
};

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