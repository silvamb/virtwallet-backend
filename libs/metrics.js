const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const UpdateExpressionBuilder = dynamodb.UpdateExpressionBuilder;
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;

const ATTR_TYPE_MAP = new Map([
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

    fromKeys(pk, sk) {
        this.accountId = pk.split("#")[1];

        if(sk){
            const [suffix, walletId, granularity, date, categoryId] = sk.split("#");
            if(suffix === "METRIC" && GRANULARITY_MAP.get(date.length) === granularity) {
                this.walletId = walletId;
                this.date = date;
                this.categoryId = categoryId;
            } else {
                console.log("Metrics SK format is inconsistent. PK:", pk, "SK:", sk);
            }
        }
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

exports.retrieve = async (dynamodb, accountId, walletId, date, categoryId) => {
    if(!accountId) {
        throw new Error("account parameters is mandatory");
    }
    
    console.log("Retrieving metrics with params: ", {accountId, walletId, date, categoryId});
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);
    const sk = getSK(walletId, date, categoryId);

    const queryBuilder = new QueryBuilder(pk).sk.beginsWith(sk);
    const queryData = await dbClient.query(queryBuilder.build());

    console.log("Total metrics retrieved: ", queryData.Items.length);
    const metrics = queryData.Items.map((item) => {
        return fromItem(item, new Metrics());
    });

    return metrics;
}

exports.upsert = async (dynamodb, metricsList = []) => {
    if(!dynamodb) {
        throw new Error("dynamodb is mandatory");
    }
    
    console.log("Recreating metrics, metric list size", metricsList.length);
    const dbClient = new DynamoDb(dynamodb);
    const updateResult = await dbClient.putItems(metricsList);

    console.log("Recreate metrics result", updateResult);

    return metricsList.map((metrics, index) => {
        return {
            metrics,
            success: updateResult[index].success
        }
    });
}

exports.deleteAll = async (dynamodb, accountId, walletId) => {
    if(!dynamodb || !accountId || !walletId) {
        throw new Error("mandatory parameters missing");
    }
    console.log("Deleting all metrics for account", accountId, "and wallet", walletId);
    
    console.log(`Retrieving all metrics to delete`);
    const metricsToDelete = await this.retrieve(dynamodb, accountId, walletId);

    console.log(`Returned ${metricsToDelete.length} metrics to delete`);

    if(metricsToDelete.length > 0){
        console.log("Deleting metrics");
        const dbClient = new DynamoDb(dynamodb);
        const deleteResult = await dbClient.deleteItems(metricsToDelete);
        return deleteResult.filter(deleteResult => deleteResult.success).map(deleteResult => fromItem(deleteResult.data.Attributes, new Metrics()))
    }

    return [];
}

exports.Metrics = Metrics;