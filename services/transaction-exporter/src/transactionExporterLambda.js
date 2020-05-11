const AWS = require('aws-sdk');
const transactionExporterHandler = require('./transactionExporterHandler');

exports.handle = async event => {
    console.log("Processing event:", event);

    try {
        const data = await transactionExporterHandler.handle(event, new AWS.DynamoDB(), new AWS.S3());
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