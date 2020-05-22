
const TABLE_NAME = "virtwallet";
const BATCH_SIZE = 25;

class AttributeValue {
    constructor(type, value) {
        this[type] = value;
    }
}

class AttributeType {
    constructor(type, transformer = (value) => value) {
        this.type = type;
        this.transformer = transformer;
    }

    getAttribute(item) {
        return item[this.type];
    }

    toAttribute(value) {
        return new AttributeValue(this.type, this.transformer(value));
    }
}

const StringAttributeType = new AttributeType("S");
const NumberAttributeType = new AttributeType("N", String);
const IntegerAttributeType = new AttributeType("N", String);
const StringSetAttributeType = new AttributeType("SS", Array.from);

function getKey(obj) {
    return {
        PK: StringAttributeType.toAttribute(obj.getHash()),
        SK: StringAttributeType.toAttribute(obj.getRange())
    };
}

function toItem(obj) {
    const item = getKey(obj);

    for( [attrName, attrType] of obj.getAttrTypeMap().entries()) {
        if(obj[attrName] !== undefined) {
            item[attrName] = attrType.toAttribute(obj[attrName]);
        }
    }

    return item;
}

function fromItem(item, obj) {
    for( [attrName, attrType] of obj.getAttrTypeMap().entries()) {
        const attr = item[attrName];
        if(typeof attr === 'object') {
            obj[attrName] = attrType.getAttribute(item[attrName]);
        } else {
            console.log(`Attribute ${attrName} not found in item, ignoring it`); 
        }
    }

    return obj;
}

async function executeInChunks(dbClient, operation, paramsList) {
    const totalItems = paramsList.length;
    const itemsInParalel = totalItems >= BATCH_SIZE ? BATCH_SIZE : totalItems;
    const queues = Array(itemsInParalel).fill(0).map((_val) => []);
    const flatResult = Array(totalItems);

    console.log(`Splitting ${totalItems} items into ${itemsInParalel} chunks`);
    let workerId;
    for (let i = 0; i < paramsList.length; i++) {
        workerId = i % itemsInParalel;
        console.log(`Item ${i} assigned to worker ${workerId}`);
        queues[workerId].push(paramsList[i]);
    }

    console.log(`Workers distribution: ${queues.map(q => q.length)}`);

    console.log(`Starting ${itemsInParalel} workers`);

    const processQueue = async (opParamsList, worker) => {
        console.log(`[${operation}-${worker}] - Starting work. Total items to process: [${opParamsList.length}]`);

        let opParams, opResult, originalIndex;
        for(let i = 0; i < opParamsList.length; i++) {
            originalIndex = (itemsInParalel * i) + worker
            console.log(`[${operation}-${worker}] - Executing item [${originalIndex}], [${i}] in this queue`);
            opParams = opParamsList[i];
            try {
                opResult = await dbClient[operation](opParams).promise();
                opResult = new Result(opResult);
                console.log(`[${operation}-${worker}] - Item [${originalIndex}] processed with success`);
            } catch(err) {
                opResult = new Result(err, false);
                console.log(`[${operation}-${worker}] - Item [${originalIndex}] processed with error`, err);
            }

            flatResult[originalIndex] = opResult;
        }
    }
    const promises = queues.map(processQueue);

    await Promise.all(promises);
    console.log(`All ${itemsInParalel} chunks processed.`);

    return flatResult;
}

class DynamoDb {

    /**
     * Dynamo DB client
     * 
     * @param {AWS.DynamoDB} dynamodb 
     */
    constructor(dynamodb) {
        this.dynamodb = dynamodb;
    }

    async putItem(obj, overwrite = true) {
        const item = toItem(obj);

        console.log(`Executing putItem, item [${JSON.stringify(item)}] `);

        const params = {
            Item: item,
            ReturnConsumedCapacity: "TOTAL",
            TableName: TABLE_NAME,
            ReturnValues: "ALL_OLD"
        };

        if(!overwrite) {
            params.ConditionExpression = "attribute_not_exists(PK)";
        }

        const result = await this.dynamodb.putItem(params).promise();

        return new Result(result);
    }

    async putItems(objArray, overwrite = true) {
        const paramsList = objArray.map(obj => {
            const item = toItem(obj);
    
            const params = {
                Item: item,
                ReturnConsumedCapacity: "TOTAL",
                TableName: TABLE_NAME,
                ReturnValues: "ALL_OLD"
            };
    
            if(!overwrite) {
                params.ConditionExpression = "attribute_not_exists(PK)";
            }

            return params;
        });

        return await executeInChunks(this.dynamodb, "putItem", paramsList);
    }

    /**
     * Query items that matches the PK and SK and bring all attributes.
     * 
     * @param {string} pk 
     * @param {string} sk 
     */
    async queryAll(pk, sk = null) {
        const params = {
            ExpressionAttributeValues: {
                ":pk": StringAttributeType.toAttribute(pk)
            },
            KeyConditionExpression: "PK = :pk",
            Select: "ALL_ATTRIBUTES",
            TableName: TABLE_NAME
        };

        if(sk) {
            params.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(sk)
            params.KeyConditionExpression =  "PK = :pk AND SK =:sk";
        }

        const data = await this.dynamodb.query(params).promise();
        console.log("Query returned:", data);

        return data;
    }

    async query(params) {
        
        console.log("Executing query with params:")
        console.log(params);

        const data = await this.dynamodb.query(params).promise();
        console.log("Query returned data");
        console.log(data);

        return data;
    }

    async deleteAll(items) {
        console.log("Executing delete all for items:", items);

        const chunks = Math.ceil(items.length/BATCH_SIZE);

        const requestItems = items.map(item => {
            return {
                DeleteRequest: {
                    Key: {
                        PK: item.PK,
                        SK: item.SK
                    }
                }
            };
        });

        const params = {RequestItems: {}};
        let itemsSlice, data, sliceStart, sliceEnd;

        console.log(`Deleting ${requestItems.length} items in ${chunks} chunk(s) of ${BATCH_SIZE} max`);
        for(let i=0; i < chunks; i++) {
            sliceStart = i * BATCH_SIZE;
            sliceEnd = Math.min(sliceStart + BATCH_SIZE, requestItems.length);
            itemsSlice = requestItems.slice(sliceStart, sliceEnd);
            params.RequestItems[TABLE_NAME] = itemsSlice;

            data = await this.dynamodb.batchWriteItem(params).promise();
            console.log(`Executed chunk ${i+1} of ${chunks}`);
            console.log(data);
        }
    }

    async getNext(pk, sk) {
        const query = new QueryBuilder(pk).sk.beginsWith(sk).count().build();

        const data = await this.query(query);

        return data.Count + 1;
    }

    async getItem(obj, attributes = new Set()) {
        console.log(`Getting item with keys [${obj.getHash()}, ${obj.getRange()}] from database`);

        const params = {
            Key: getKey(obj),
            TableName: TABLE_NAME
        };

        if(attributes.length > 0) {
            attributes.add("PK");
            attributes.add("SK");
            params.ProjectionExpression = Array.from(attributes).join();
        }

        const result = await this.dynamodb.getItem(params).promise();

        console.log("Item retrieved:", result);

        return result.Item;
    }

    async load(obj, attributes = new Set()) {
        const item = await this.getItem(obj, attributes);

        if(item) {
            console.log(`Loading attributes into object [${obj.getHash()}, ${obj.getRange()}]`);
            fromItem(item, obj);
        }

        return item !== undefined;
    }

    /**
     * Update all items.
     * 
     * @param {*} paramsList list of Dynamo DB updateItem parameters
     */
    async updateItems(paramsList) {
        console.log("Executing updateItem for items:", paramsList);

        if(paramsList.length == 1) {
            try {
                const updateItemResult = await this.dynamodb.updateItem(paramsList[0]).promise();
                return [ new Result(updateItemResult) ];
            } catch(err) {
                return [ new Result(err, false) ];
            }
        }

        return await executeInChunks(this.dynamodb, "updateItem", paramsList);
    }

    /**
     * Update a single object in the database.
     * 
     * @param {*} updatedObj the Object to update
     * @param {*} updatedAttr the attributes to be updated
     */
    async updateItem(updatedObj, updatedAttr) {
        const updateParams = new UpdateExpressionBuilder(updatedObj).updateTo(updatedAttr).build();

        const updateResult = await this.updateItems([updateParams]);

        return updateResult[0];
    }
}

function SkBuilder(expressionBuilder) {
    return {
        beginsWith: value => {
            expressionBuilder.KeyConditionExpression += " AND begins_with(SK, :sk)";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        },

        between: (value1, value2) => {
            expressionBuilder.KeyConditionExpression += " AND SK BETWEEN :sk_start AND :sk_end";
            expressionBuilder.ExpressionAttributeValues[":sk_start"] = StringAttributeType.toAttribute(value1);
            expressionBuilder.ExpressionAttributeValues[":sk_end"] = StringAttributeType.toAttribute(value2);
            return expressionBuilder;
        },
        equals: value => {
            expressionBuilder.KeyConditionExpression += " AND SK = :sk";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        },
        greaterThan: value => {
            expressionBuilder.KeyConditionExpression += " AND SK > :sk";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        },
        greaterThanOrEqual: value => {
            expressionBuilder.KeyConditionExpression += " AND Sk >= :sk";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        },
        lessThan: value => {
            expressionBuilder.KeyConditionExpression += " AND SK < :sk";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        },
        lessThanOrEqual: value => {
            expressionBuilder.KeyConditionExpression += " AND SK <= :sk";
            expressionBuilder.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
            return expressionBuilder;
        }
    }
}

class QueryBuilder {
    constructor(pk) {
        this.ExpressionAttributeValues = {
            ":pk": StringAttributeType.toAttribute(pk)
        };
        this.KeyConditionExpression = "PK = :pk";
    }

    get sk() {
        return SkBuilder(this);
    }

    withFilterExpression(filterExpression) {
        this.FilterExpression = filterExpression.expression;

        this.ExpressionAttributeValues = Object.assign(this.ExpressionAttributeValues || {}, filterExpression.exprAttributeValues);
        this.ExpressionAttributeNames = Object.assign(this.ExpressionAttributeNames || {}, filterExpression.exprAttributeNames);

        return this;
    }

    withLimit(limit) {
        this.Limit = String(limit);
        return this;
    }

    returnAttributes(...attributes) {
        const projectionExpression = attributes.join(",");

        this.ProjectionExpression = projectionExpression;
        this.Select = "ALL_PROJECTED_ATTRIBUTES";
        return this;
    }

    returnKeys() {
        this.ProjectionExpression = "PK,SK";
        return this;
    }

    count() {
        this.Select = "COUNT";
        return this;
    }

    build() {
        return {
            ExpressionAttributeValues: this.ExpressionAttributeValues,
            ExpressionAttributeNames: this.ExpressionAttributeNames,
            KeyConditionExpression: this.KeyConditionExpression,
            FilterExpression: this.FilterExpression,
            ProjectionExpression: this.ProjectionExpression,
            TableName: TABLE_NAME
        };
    }
}

class ExpressionBuilder {

    constructor() {
        this.expressionParts = [];
        this.exprAttributeNames = {};
        this.exprAttributeValues = {};
    }

    equals(name, value) {
        this.expressionParts.push(`#${name} = :${name}`);
        this.exprAttributeNames[`#${name}`] = name;
        this.exprAttributeValues[`:${name}`] = value;

        return this;
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     * @param {AttributeValue} to 
     */
    between(attrName, from, to) {
        console.log(`Adding filter to attribute [${attrName}]: BETWEEN [${JSON.stringify(from)} AND ${JSON.stringify(to)}]`);

        this.expressionParts.push(`#${attrName} BETWEEN :${attrName}_start AND :${attrName}_end`);
        this.exprAttributeNames[`#${attrName}`] = attrName;
        this.exprAttributeValues[`:${attrName}_start`] = from;
        this.exprAttributeValues[`:${attrName}_end`] = to;

        return this;
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} to 
     */
    lessThanOrEqual(attrName, to) {
        this.expressionParts.push(`#${attrName} <= :${attrName}`);
        this.exprAttributeNames[`#${attrName}`] = attrName;
        this.exprAttributeValues[`:${attrName}`] = to;

        return this;
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     */
    greaterThanOrEqual(attrName, from) {
        this.expressionParts.push(`#${attrName} >= :${attrName}`);
        this.exprAttributeNames[`#${attrName}`] = attrName;
        this.exprAttributeValues[`:${attrName}`] = from;

        return this;
    }

    get or() {
        this.expressionParts.push("OR");
        return this;
    }

    get and() {
        this.expressionParts.push("AND");
        return this;
    }

    build() {
        return {
            expression: this.expressionParts.join(" "),
            exprAttributeNames: this.exprAttributeNames,
            exprAttributeValues: this.exprAttributeValues,
        }
    }
}

class UpdateExpressionBuilder {
    constructor(itemToUpdate) {
        this.itemToUpdate = itemToUpdate;
        this.addExpressions = [];
        this.setExpressions = [];
        this.exprAttributeNames = {};
        this.exprAttributeValues = {};
        this.conditionExpressions = [];
    }

    addTo(attribute, value) {
        const attrTypeMap = this.itemToUpdate.getAttrTypeMap();
        this.exprAttributeValues[`:${attribute}`] = attrTypeMap.get(attribute).toAttribute(value);
        this.exprAttributeNames[`#${attribute}`] = attribute;

        this.addExpressions.push(`#${attribute} :${attribute}`);

        return this;
    }

    set(attribute, value) {
        const attrTypeMap = this.itemToUpdate.getAttrTypeMap();
        this.exprAttributeValues[`:${attribute}`] = attrTypeMap.get(attribute).toAttribute(value);
        this.exprAttributeNames[`#${attribute}`] = attribute;

        this.setExpressions.push(`#${attribute} = :${attribute}`);

        return this;
    }

    updateTo(attrsToUpdate) {
        const attrTypeMap = this.itemToUpdate.getAttrTypeMap();
        let oldValue;
        for(let attribute in attrsToUpdate) {
            if(this.itemToUpdate.hasOwnProperty(attribute)) {
                this.set(attribute, attrsToUpdate[attribute]);

                oldValue = this.itemToUpdate[attribute];
                this.exprAttributeValues[`:old_${attribute}`] = attrTypeMap.get(attribute).toAttribute(oldValue);
                this.conditionExpressions.push(`#${attribute} = :old_${attribute}`);
            }
        }

        return this;
    }

    build() {
        const addExpression = this.addExpressions.length > 0 ? `ADD ${this.addExpressions.join()}` : "";
        const setExpression = this.setExpressions.length > 0 ? `SET ${this.setExpressions.join()}` : ""

        const updateExpression = {
            ExpressionAttributeNames: this.exprAttributeNames,
            ExpressionAttributeValues: this.exprAttributeValues,
            Key: getKey(this.itemToUpdate),
            ReturnValues: "ALL_NEW", 
            TableName: TABLE_NAME, 
            UpdateExpression: `${addExpression} ${setExpression}`
        }

        if(this.conditionExpressions.length > 0) {
            updateExpression.ConditionExpression = this.conditionExpressions.join(" AND ");
        }

        return updateExpression;
    }
}

class Result {

    constructor(result, success = true) {
        this.data = result;
        this.success = success;
    }

}

exports.DynamoDb = DynamoDb;
exports.QueryBuilder = QueryBuilder;
exports.ExpressionBuilder = ExpressionBuilder;
exports.UpdateExpressionBuilder = UpdateExpressionBuilder;
exports.toItem = toItem;
exports.fromItem = fromItem;
exports.AttributeValue = AttributeValue;
exports.StringAttributeType = StringAttributeType;
exports.NumberAttributeType = NumberAttributeType;
exports.StringSetAttributeType = StringSetAttributeType;
exports.IntegerAttributeType = IntegerAttributeType;
exports.PK = "PK";
exports.SK = "SK";