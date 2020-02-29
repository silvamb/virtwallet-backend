
class FileRouter {
    constructor(sqsClient) {
        this.sqsClient = sqsClient;
    }

    async routeToQueue(record) {
        console.log("Routing new S3 Record", record.s3);

        const fileInfo = getInfoFromObjKey(record.s3);
    
        console.log("File info extracted from S3 key", fileInfo);

        const queueUrl = process.env[fileInfo.parserName];
    
        if(!queueUrl) {
            throw new Error(`Queue URL not defined for queue ${fileInfo.parserName}`);
        }
    
        const enqueueResult = await enqueue(this.sqsClient, queueUrl, fileInfo);

        console.log("Enqueue Result", enqueueResult);
        // TODO handle errors and update the file record in dynamodb

        return enqueueResult.MessageId;
    }
}

function getInfoFromObjKey(s3Info) {
    const keyRegex = /account-files\/([0-9a-f\-]+)\/(\d{4})\/parsers\/(\w+)\/(.*)/;

    const matches = s3Info.object.key.match(keyRegex);

    if(!matches) {
        throw new Error('S3 Object does not match the expected key format')
    }

    return {
        account: matches[1],
        wallet: matches[2],
        parserName: matches[3],
        fileName: matches[4],
        bucketName: s3Info.bucket.name,
        objectKey: s3Info.object.key
    };
}

function enqueue(sqsClient, queueUrl, fileInfo) {
    
    var params = {
        MessageBody: JSON.stringify(fileInfo),
        QueueUrl: queueUrl
    };

    return sqsClient.sendMessage(params).promise();
}

exports.FileRouter = FileRouter;