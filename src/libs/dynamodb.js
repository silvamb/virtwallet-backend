
const TABLE_NAME = "virtwallet";

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

    async putItem(obj) {
        const item = toItem(obj);

        console.log(`Executing putItem, item [${JSON.stringify(item)}] `);

        const params = {
            Item: item,
            ReturnConsumedCapacity: "TOTAL",
            TableName: TABLE_NAME,
            ReturnValues: "ALL_OLD"
        };

        return this.dynamodb.putItem(params).promise();
    }

    async putItems(objArray) {
        const totalItems = objArray.length;
        const itemsInParalel = totalItems >= 25 ? 25 : totalItems;
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
            console.log(`[Worker-${worker}] - Starting work. Total items to process: [${objsToAdd.length}]`);

            let obj, putItemResult, originalIndex;
            for(let i = 0; i < objsToAdd.length; i++) {
                originalIndex = (itemsInParalel * i) + worker
                console.log(`[Worker-${worker}] - Executing putItem for item [${originalIndex}], [${i}] in this queue`);
                obj = objsToAdd[i];
                try {
                    putItemResult = await this.putItem(obj);
                } catch(err) {
                    putItemResult = err;
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
        console.log(data);

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

    withFilterExpression(filterExpression) {
        this.FilterExpression = filterExpression.expression;

        for(let [exprAttrName, exprAttrValue] of filterExpression.exprAttributes) {
            this.ExpressionAttributeValues[exprAttrName] = exprAttrValue;
        }

        return this;
    }

    build() {
        return {
            ExpressionAttributeValues: this.ExpressionAttributeValues,
            KeyConditionExpression: this.KeyConditionExpression,
            FilterExpression: this.FilterExpression,
            Select: "ALL_ATTRIBUTES",
            TableName: TABLE_NAME
        };
    }
}

class FilterExpressionBuilder {

    constructor() {
        this.expression = "";
        this.exprAttributes = new Map();
    }

    addExpression(expression, exprAttrToAdd, logicalOp = "AND") {
        console.log(`Adding expression [${expression}] with values ${exprAttrToAdd}`);
        if(this.expression.length > 0) {
            this.expression = ` ${logicalOp} ${this.expression}`;
        } else {
            this.expression = expression;
        }

        for (let [exprAttrName, exprAttrValue] of exprAttrToAdd) {
            this.exprAttributes.set(exprAttrName, exprAttrValue);
        }

        return this;
    }

    /**
     *
     * @param {string} attrName 
     * @param {AttributeValue} from 
     * @param {AttributeValue} to 
     */
    between(attrName, from, to) {
        console.log(`Adding filter to attribute [${attrName}]: BETWEEN [${JSON.stringify(from)} to ${JSON.stringify(to)}]`);

        const startAttr = `:${attrName}_start`;
        const endAttr = `:${attrName}_end`;
        const exprAttrToAdd = new Map([
            [startAttr, to],
            [endAttr, from]
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

    build() {
        return {
            expression: this.expression,
            exprAttributes: this.exprAttributes
        }
    }
}

exports.DynamoDb = DynamoDb;
exports.QueryBuilder = QueryBuilder;
exports.FilterExpressionBuilder = FilterExpressionBuilder;
exports.toItem = toItem;
exports.fromItem = fromItem;
exports.AttributeValue = AttributeValue;
exports.StringAttributeType = StringAttributeType;
exports.NumberAttributeType = NumberAttributeType;
exports.StringSetAttributeType = StringSetAttributeType;
exports.IntegerAttributeType = IntegerAttributeType;