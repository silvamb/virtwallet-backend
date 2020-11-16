const AWS = require('aws-sdk');
const accountHandler = require('./accountHandler');

exports.handle = async event => {
    
    console.log(event);

    try {
        const data = await accountHandler.handle(event, new AWS.DynamoDB());
        return new AccountResponse(data);
    } catch(err) {
        console.log(err);
        return new AccountResponse({message: err.message}, 500);
    }
};

class AccountResponse {
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