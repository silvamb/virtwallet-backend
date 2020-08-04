
class FileRouter {
    constructor(eventbridge) {
        this.eventbridge = eventbridge;
    }

    async publishEvent(record) {
        console.log("Publishing event for new S3 Record", record.s3);

        const fileInfo = getInfoFromObjKey(record.s3);

        console.log("File info extracted from S3 key", fileInfo);

        const params = {
            Entries: [{
                Source: 'virtwallet',
                DetailType: 'file ready to parse',
                Time: new Date(),
                Detail: JSON.stringify(fileInfo)
            }]
        };

        const result = await this.eventbridge.putEvents(params).promise();

        console.log("Event Result", result);

        return result;
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

exports.FileRouter = FileRouter;