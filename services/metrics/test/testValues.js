const Metrics = require('libs/metrics').Metrics;

exports.ACCOUNT_ID = "4811b387618c0-4277-98e9-ba34210bdcf3";

exports.getAccountMetricsEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                aud: "10v21l6b17g3t27sfbe38b0i8n"
            }
        }
    },
    queryStringParameters:{
    },
    pathParameters: {
        accountId: exports.ACCOUNT_ID,
    }
}

exports.getMetricsWithWalletEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                aud: "10v21l6b17g3t27sfbe38b0i8n"
            }
        }
    },
    queryStringParameters:{
        walletId: "0001"
    },
    pathParameters: {
        accountId: exports.ACCOUNT_ID,
    }
}

exports.getMetricsWithWalletAndDateEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                aud: "10v21l6b17g3t27sfbe38b0i8n"
            }
        }
    },
    queryStringParameters:{
        walletId: "0001",
        date: "2019-12-19"
    },
    pathParameters: {
        accountId: exports.ACCOUNT_ID,
    }
}

exports.getMetricsWithWalletDateAndCategoryEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                aud: "10v21l6b17g3t27sfbe38b0i8n"
            }
        }
    },
    queryStringParameters:{
        walletId: "0001",
        date: "2019-12-19",
        categoryId: "01"
    },
    pathParameters: {
        accountId: exports.ACCOUNT_ID,
    }
}

exports.singleResult = {
    Count: 1,
    Items: [
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2019-12-19#01" },
            count: {
                N: "1",
            },
            sum: { N: "3.75" }
        },
    ],
    ScannedCount: 1,
};

exports.categoryQueryResult = {
    Count: 1,
    Items: [
        {
            PK: { S: `ACCOUNT#${this.ACCOUNT_ID}` },
            SK: { S: "CATEGORY#01" },
            accountId: { S: this.ACCOUNT_ID },
            categoryId: { S: "01" },
            name: { S: "Category Name" },
            description: { S: "Category Description" },
        },
    ],
    ScannedCount: 1,
};

function createMetric() {
    const metric = new Metrics(exports.ACCOUNT_ID, "0001", "2019-12-19", "01");
    metric.add("3.75");
    return metric;
}

exports.expectedMetric = createMetric();

exports.csvResult = "accountId,walletId,date,category,sum,count\r\n4811b387618c0-4277-98e9-ba34210bdcf3,0001,2019-12-19,Category Name,3.75,1"

exports.DynamoDbMock = class {

    constructor(paramsValidators = [], returnValues = []) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
    }

    query(params) {
        const validator = this.paramsValidators.pop();
        validator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}

exports.S3Mock = class {

    constructor(paramsValidator, returnValues = []) {
        this.paramsValidator = paramsValidator;
        this.returnValues = returnValues.reverse();
    }

    putObject(params) {
        this.paramsValidator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}