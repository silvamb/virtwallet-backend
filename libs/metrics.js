const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const UpdateExpressionBuilder = dynamodb.UpdateExpressionBuilder;

const ATTR_TYPE_MAP = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["walletId", dynamodb.StringAttributeType],
    ["date", dynamodb.StringAttributeType],
    ["categoryId", dynamodb.StringAttributeType],
    ["sum", dynamodb.NumberAttributeType],
    ["count", dynamodb.NumberAttributeType]
]);

const GRANULARITY_MAP = new Map([
    [4, "Y"],
    [7, "M"],
    [10, "D"]
]);

const getPK = accountId => `ACCOUNT#${accountId}`;
const getSK = (walletId = "", date, categoryId) => {
    let sk = `METRIC#${walletId}`;

    if(date) {
        const granularity = GRANULARITY_MAP.get(date.length);

        if(!granularity) {
            throw new Error(`Invalid date format [${date}]`);
        }

        sk = sk.concat(`#${granularity}#${date}`);
    }

    if(categoryId) {
        sk = sk.concat(`#${categoryId}`);
    }

    return sk;
}

class Metrics {
    constructor(accountId = "", walletId = "", date = "", categoryId = "NO_CATEGORY") {
        this.accountId = accountId;
        this.walletId = walletId;
        this.date = date;
        this.categoryId = categoryId;
        this.sum = 0;
        this.count = 0; 
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.walletId, this.date, this.categoryId);
    }

    getAttrTypeMap() {
        return ATTR_TYPE_MAP;
    }

    add(value) {
        this.sum += Number(value);

        const increment = Number(value) >= 0 ? 1 : -1;
        this.count += increment;
    }

    async load(dynamodb) {
        const dbClient = new DynamoDb(dynamodb);

        await dbClient.load(this);
    }
}

/**
 * Update the metrics in the database. Will increment/decrement the metric values
 * based on the provided input.
 * 
 * @param {AWS.DynamoDB} dynamodb Dynamo DB client library
 * @param {Array<Metrics>} metricsList list of metrics to update
 */
exports.update = async (dynamodb, metricsList) => {
    console.log("Updating metrics in database, input: ", metricsList);
    const dbClient = new DynamoDb(dynamodb);
    
    console.log("Creating update expressions to update metrics");
    const updateParamsList = metricsList.map(metrics => {
            return new UpdateExpressionBuilder(metrics).addTo("count", metrics.count).addTo("sum", metrics.sum).build();
    });

    const updateResult = await dbClient.updateItems(updateParamsList);

    printUpdateResults(metricsList, updateResult);

    return updateResult;
}

function printUpdateResults(items, results) {
    let result;
    let transformedResult;

    for(let i = 0; i < items.length; i++) {
        result = results[i];
        transformedResult = {
            success: result.success
        };
    
        if(!result.success) {
            transformedResult.code = result.data.code;
            transformedResult.message = result.data.message;
        }

        console.log(`Result from item ${items[i].getRange()}:`, transformedResult);
    }
}

exports.Metrics = Metrics;