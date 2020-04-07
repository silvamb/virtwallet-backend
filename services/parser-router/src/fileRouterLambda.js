const AWS = require('aws-sdk');
const FileRouter = require('./fileRouterHandler').FileRouter;
const fileRouter = new FileRouter(new AWS.EventBridge());

exports.handle = async event => {
    
    const records = event.Records;

    if(!Array.isArray(records) || records.length < 1 ) {
        throw new Error('No records to process!');
    }

    const promises = records.map(publishEvents);

    const results = await Promise.all(promises);
    
    results.forEach(result => console.log(result));

    return results;
};

function publishEvents(record) {
    return fileRouter.publishEvent(record);
}