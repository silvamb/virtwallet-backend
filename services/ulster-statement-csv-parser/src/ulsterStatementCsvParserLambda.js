const handler = require('./ulsterStatementCsvParserHandler');
const UlsterCsvParserHandler = handler.UlsterCsvParserHandler;
const AWS = require('aws-sdk');
const csvParserHandler = new UlsterCsvParserHandler(new AWS.S3(), new AWS.EventBridge());

exports.handle = async event => {
    
    // FIX THIS. ADD PERMISSIONS IN SERVERLESS YAML TOO

    const detail = event.detail;

    const result = await csvParserHandler.handle(detail);

    return result;
};