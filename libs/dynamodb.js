
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

        return this.dynamodb.putItem(params).promise();
    }

    async putItems(objArray, overwrite = true) {
        const totalItems = objArray.length;
        const itemsInParalel = totalItems >= BATCH_SIZE ? BATCH_SIZE : totalItems;
        const queues = Array(itemsInParalel).fill(0).map((_val) => []);
        const flatResult = Array(totalItems);

        console.log(`Splitting ${totalItems} items into ${itemsInParalel} chunks`);
        let workerId;
        for (let i = 0; i < objArray.length; i++) {
            workerId = i % itemsInParalel;
            console.log(`Item ${i} assigned to worker ${workerId}`);
            queues[workerId].push(objArray[i]);
        }
    
        console.log(`Workers distribution: ${queues.map(q => q.length)}`);

        console.log(`Starting ${itemsInParalel} workers`);

        const processQueue = async (objsToAdd, worker) => {
            console.log(`[PutItem-${worker}] - Starting work. Total items to process: [${objsToAdd.length}]`);

            let obj, putItemResult, originalIndex;
            for(let i = 0; i < objsToAdd.length; i++) {
                originalIndex = (itemsInParalel * i) + worker
                console.log(`[PutItem-${worker}] - Executing item [${originalIndex}], [${i}] in this queue`);
                obj = objsToAdd[i];
                try {
                    putItemResult = await this.putItem(obj, overwrite);
                    putItemResult = new PutItemResult(putItemResult);
                    console.log(`[PutItem-${worker}] - Item [${originalIndex}] processed with success`);
                } catch(err) {
                    putItemResult = new PutItemResult(err, false);
                    console.log(`[PutItem-${worker}] - Item [${originalIndex}] processed with error`, err);
                }

                flatResult[(itemsInParalel * i) + worker] = putItemResult;
            }
        }
        const promises = queues.map(processQueue);

        await Promise.all(promises);
        console.log(`All ${itemsInParalel} chunks processed.`);

        return flatResult;
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
        console.log("Executing delete all for items:")
        console.log(items);

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
        const query = new QueryBuilder(pk).withSkStartingWith(sk).count().build();

        const data = await this.query(query);

        return data.Count + 1;
    }
}

class QueryBuilder {
    constructor(pk) {
        this.ExpressionAttributeValues = {
            ":pk": StringAttributeType.toAttribute(pk)
        };
        this.KeyConditionExpression = "PK = :pk";
    }

    withSk(sk) {
        this.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(sk);
        this.KeyConditionExpression = this.KeyConditionExpression.concat(" AND SK = :sk");
        return this;
    }

    withSkStartingWith(value) {
        this.ExpressionAttributeValues[":sk"] = StringAttributeType.toAttribute(value);
        this.KeyConditionExpression = this.KeyConditionExpression.concat(" AND begins_with(SK, :sk)");
        return this;
    }

    withSkExpression(skExpression) {
        this.KeyConditionExpression = this.KeyConditionExpression.concat(` AND ${skExpression.expression}`);

        for(let [exprAttrName, exprAttrValue] of skExpression.exprAttributes) {
            this.ExpressionAttributeValues[exprAttrName] = exprAttrValue;
        }

        return this;
    }

    withFilterExpression(filterExpression) {
        this.FilterExpression = filterExpression.expression;

        for(let [exprAttrName, exprAttrValue] of filterExpression.exprAttributes) {
            this.ExpressionAttributeValues[exprAttrName] = exprAttrValue;
        }

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
        this.exprAttributes = new Map();
    }

    addExpression(expression, exprAttrToAdd = new Map()) {
        console.log(`Adding expression [${expression}] with values ${exprAttrToAdd}`);
        this.expressionParts.push(expression);

        for (let [exprAttrName, exprAttrValue] of exprAttrToAdd) {
            this.exprAttributes.set(exprAttrName, exprAttrValue);
        }

        return this;
    }

    equals(name, value) {
        const attrName = `:${name}`;
        const expression = `${name} = ${attrName}`;
        const exprAttrToAdd = new Map([[attrName, value]]);

        return this.addExpression(expression, exprAttrToAdd);
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     * @param {AttributeValue} to 
     */
    between(attrName, from, to) {
        console.log(`Adding filter to attribute [${attrName}]: BETWEEN [${JSON.stringify(from)} AND ${JSON.stringify(to)}]`);

        const startAttr = `:${attrName}_start`;
        const endAttr = `:${attrName}_end`;
        const exprAttrToAdd = new Map([
            [startAttr, from],
            [endAttr, to]
        ]);
        const expression = `${attrName} BETWEEN ${startAttr} AND ${endAttr}`;

        return this.addExpression(expression, exprAttrToAdd);
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     * @param {AttributeValue} to 
     */
    lessThanOrEqual(attrName, to) {
        const toAttr = `:${attrName}`;
        const exprAttrToAdd = new Map([
            [toAttr, to]
        ]);
        const expression = `${attrName} <= ${toAttr}`;

        return this.addExpression(expression, exprAttrToAdd);
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     */
    greaterThanOrEqual(attrName, from) {
        const fromAttr = `:${attrName}`;
        const exprAttrToAdd = new Map([
            [fromAttr, from]
        ]);
        const expression = `${attrName} >= ${fromAttr}`;

        return this.addExpression(expression, exprAttrToAdd);
    }

    get or() {
        this.addExpression("OR");
        return this;
    }

    get and() {
        this.addExpression("AND");
        return this;
    }

    build() {
        return {
            expression: this.expressionParts.join(" "),
            exprAttributes: this.exprAttributes
        }
    }
}

class PutItemResult {

    constructor(result, success = true) {
        this.data = result;
        this.success = success;
    }

}

exports.DynamoDb = DynamoDb;
exports.QueryBuilder = QueryBuilder;
exports.ExpressionBuilder = ExpressionBuilder;
exports.toItem = toItem;
exports.fromItem = fromItem;
exports.AttributeValue = AttributeValue;
exports.StringAttributeType = StringAttributeType;
exports.NumberAttributeType = NumberAttributeType;
exports.StringSetAttributeType = StringSetAttributeType;
exports.IntegerAttributeType = IntegerAttributeType;
exports.PK = "PK";
exports.SK = "SK";