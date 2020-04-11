const AWS = require('aws-sdk');
const categoryRuleHandler = require('./categoryRuleHandler');

exports.handle = async event => {
    
    console.log(event);

    try {
        const data = await categoryRuleHandler.handle(event, new AWS.DynamoDB());
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
    }
}