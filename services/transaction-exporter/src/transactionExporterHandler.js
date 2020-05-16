const transaction = require('libs/transaction');
const Transaction = transaction.Transaction;
const TransactionFilter = transaction.TransactionFilter;
const dynamodb = require('libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;

const category = require('libs/category');

const fileExtensionMap = new Map([
   [",", ".csv"],
   ["tab", ".tsv"],
   [";", ".csv"],
   [" ", ".txt"]
]);

exports.handle = async (event, dynamoDb, s3) => {
    // FIX ME change for a utility function
    const accountId = event.pathParameters.accountId;
    const walletId = event.pathParameters.walletId;
    
    const from = event.queryStringParameters.from;
    const to = event.queryStringParameters.to;
    const delimiter = event.queryStringParameters.delimiter || ",";
    const order = event.queryStringParameters.order;

    const requestTime = event.requestContext.requestTimeEpoch;

    const dbClient = new DynamoDb(dynamoDb);

    const transactionFilter = new TransactionFilter().between(from, to);
    const transactions = await transaction.list(dbClient, accountId, walletId, transactionFilter, order);

    await setCategoryNames(dynamoDb, accountId, transactions);

    const dsv = convertToDsv(transactions, delimiter);
    const fileName = generateFileName(requestTime, from, to, delimiter);
    const url = await uploadFileToS3(s3, accountId, walletId, fileName, dsv);

    return url;
};

async function setCategoryNames(dynamoDb, accountId, transactions) {
    const mapCategories = (categoryMap, category) => {
        categoryMap.set(category.categoryId, category.name);
    
        return categoryMap;
    };
    console.log("Loading categories names from database");
    const categoriesList = await category.list(dynamoDb, accountId);
    const categoriesMap = categoriesList.reduce(mapCategories, new Map());

    console.log("Setting categories names to transactions");
    transactions.forEach(transaction => {
        if(categoriesMap.has(transaction.categoryId)) {
            transaction.categoryId = categoriesMap.get(transaction.categoryId);
        }
    });
}

function convertToDsv(transactions, delimiter) {
    console.log("Converting transactions to DSV");

    const lineSeparator = "\r\n";
    const attributes = Object.keys(new Transaction());
    const headers = attributes.join(delimiter);
    
    const dsv = transactions.map(transaction => {
        return attributes.map(attr => {
            const attributeValue = String(transaction[attr] || "");
            return attributeValue.includes(delimiter) ? `"${attributeValue}"` : attributeValue;
        }).join(delimiter);
    }).join(lineSeparator);
    
    console.log(`Transactions to DSV. Total characters (Body): ${dsv.length}`);

    return headers + lineSeparator + dsv;
}

function generateFileName(requestTime,from, to, delimiter) {
    const extension = fileExtensionMap.get(delimiter);

    return `transactions_${from}_to_${to}_${requestTime}${extension}`;
}

async function uploadFileToS3(s3, accountId, walletId, fileName, data) {
    const s3Key = `export-files/${accountId}/${walletId}/${fileName}`;

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
    
    const getSignedUrlParams = {
        Bucket: process.env.ACCOUNT_FILES_BUCKET,
        Key: s3Key
    };

    console.log("Creating signed URL with params", getSignedUrlParams);
    const url = s3.getSignedUrl('getObject', getSignedUrlParams);
    console.log('URL generated:', url);

    return url;
}