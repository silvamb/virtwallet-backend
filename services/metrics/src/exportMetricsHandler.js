const metrics = require('libs/metrics');
const CategoryList = require('libs/category').CategoryList;

function convertToCsv(data) {
    console.log("Converting metrics to CSV");

    const delimiter = ","
    const lineSeparator = "\r\n";
    const attributes = ["accountId","walletId","date","category","sum","count"];
    const headers = attributes.join(delimiter);
    
    const dsv = data.map(item => {
        return attributes.map(attr => {
            const attributeValue = String(item[attr] || "");
            return attributeValue.includes(delimiter) ? `"${attributeValue}"` : attributeValue;
        }).join(delimiter);
    }).join(lineSeparator);
    
    console.log(`Transactions to DSV. Total characters (Body): ${dsv.length}`);

    return headers + lineSeparator + dsv;
}

async function uploadFileToS3(s3, accountId, data) {
    const now = new Date().toISOString();
    const dateMask = now.replace(/[\-T\:\.]/gi, "");
    const s3Key = `account-data/${accountId}/metrics_data_${dateMask}.csv`;

    const putObjectParams = {
        Bucket: process.env.ACCOUNT_FILES_BUCKET,
        Key: s3Key,
        ContentType: "text/csv",
        StorageClass: "ONEZONE_IA",
        Body: data
    };

    console.log(`Uploading key ${s3Key} to S3 bucket ${putObjectParams.Bucket}`);
    const putObjectResponse = await s3.putObject(putObjectParams).promise();
    console.log("File uploaded", putObjectResponse);

    return s3Key;
}

exports.exportMetrics =  async (event, dynamodb, s3) => {
    
    if(!event.pathParameters || !event.pathParameters.accountId) {
        throw new Error("Missing account ID");
    }
    const accountId = event.pathParameters.accountId;
    const metricsList = await metrics.retrieve(dynamodb, accountId);

    if(metricsList.length > 0) {
        const categories = new CategoryList(dynamodb);
        await categories.load(accountId);

        console.log("Mapping categories");
        let category;
        metricsList.forEach(metric => {
            category = categories.getCategory(metric.categoryId);
            metric.category = category ? category.name : "Unclassified";
        });

        const csv = convertToCsv(metricsList);

        return uploadFileToS3(s3, accountId, csv);
    }
}

