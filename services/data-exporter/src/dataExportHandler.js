const account = require('libs/account');

exports.handle = async (event, dynamodb, s3) => {
    if(!event.pathParameters || !event.pathParameters.accountId) {
        throw new Error("Missing account ID");
    }

    const accountId = event.pathParameters.accountId;  
    const data = await account.getAll(dynamodb, accountId);

    return await uploadFileToS3(s3, accountId, data);
}

async function uploadFileToS3(s3, accountId, data) {
    const now = new Date().toISOString();
    const dateMask = now.replace(/[\-T\:\.]/gi, "");
    const s3Key = `account-data/${accountId}/account_data_${dateMask}.json`;

    const putObjectParams = {
        Bucket: process.env.ACCOUNT_FILES_BUCKET,
        Key: s3Key,
        ContentType: "application/json",
        StorageClass: "ONEZONE_IA",
        Body: JSON.stringify(data)
    };

    console.log(`Uploading key ${s3Key} to S3 bucket ${putObjectParams.Bucket}`);
    const putObjectResponse = await s3.putObject(putObjectParams).promise();
    console.log("File uploaded", putObjectResponse);

    return s3Key;
}