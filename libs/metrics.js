const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const UpdateExpressionBuilder = dynamodb.UpdateExpressionBuilder;
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;

const ATTR_TYPE_MAP = new Map([
    ["sum", dynamodb.NumberAttributeType],
    ["count", dynamodb.NumberAttributeType],
    ["versionId", dynamodb.NumberAttributeType]
]);

const GRANULARITY_MAP = new Map([
    [4, "Y"],
    [7, "M"],
    [10, "D"]
]);

const getPK = accountId => `ACCOUNT#${accountId}`;
const getSK = (walletId = "", granularity, date, categoryId) => {
    let sk = `METRIC#${walletId}`;

    if(granularity) {
        sk = sk.concat(`#${granularity}`);
    }

    if(date) {
        const granularityFromDate = GRANULARITY_MAP.get(date.length);

        if(!granularity) {
            granularity = granularityFromDate;
            sk = sk.concat(`#${granularity}#${date}`);
        } else {
            sk = sk.concat(`#${date}`);
        }

        if(!granularityFromDate || granularity !== granularityFromDate) {
            throw new Error(`Invalid date format [${date}]`);
        }
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
        this.versionId = 1;
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.walletId, undefined, this.date, this.categoryId);
    }

    getAttrTypeMap() {
        return ATTR_TYPE_MAP;
    }

    getType() {
        return "Metrics";
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
        return new UpdateExpressionBuilder(metrics).addTo("count", metrics.count).addTo("sum", metrics.sum).addTo("versionId", 1).build();
    });

    const updateItemsResult = await dbClient.updateItems(updateParamsList);

    return updateItemsResult.map(updateItemResult => {
        if(updateItemResult.success) {
            return {
                data: fromItem(updateItemResult.data.Attributes, new Metrics())
            }
        } else {
            return {
                err: updateItemResult.data
            }
        }
    });
}

exports.retrieve = async (dynamodb, accountId, walletId, granularity, date, categoryId) => {
    if(!accountId) {
        throw new Error("account parameters is mandatory");
    }
    
    console.log("Retrieving metrics with params: ", {accountId, walletId, granularity, date, categoryId});
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);
    const sk = getSK(walletId, granularity, date, categoryId);

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
    const putItemsResult = await dbClient.putItems(metricsList);

    console.log("Recreate metrics result", putItemsResult);

    return putItemsResult.map((putItemResult, index) => {
        if(putItemResult.success) {
            return {
                data: metricsList[index]
            }
        } else {
            return {
                err: putItemResult.data
            }
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
        const deleteItemsResult = await dbClient.deleteItems(metricsToDelete);

        return deleteItemsResult.map(updateItemResult => {
            if(updateItemResult.success) {
                return {
                    data: fromItem(updateItemResult.data.Attributes, new Metrics())
                }
            } else {
                return {
                    err: updateItemResult.data
                }
            }
        });
    }

    return [];
}

exports.Metrics = Metrics;