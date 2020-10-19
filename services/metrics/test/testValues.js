const { Metrics } = require('libs/metrics');

exports.ACCOUNT_ID = "4811b387618c0-4277-98e9-ba34210bdcf3";

exports.sameDayAndCategoryUpdateEvent = {
    'detail-type': 'transactions created',
    detail: {
        transactions: [
            {
                accountId: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
                walletId: '0001',
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: "4",
                categoryId: "01"
            },
            {
                accountId: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
                walletId: '0001',
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: "5",
                categoryId: "01"
            }
        ]
    }
};

exports.valueUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-03-03",
        referenceMonth: "2020-03",
        txId: "202003030001",
        old: {
            categoryId: "01",
            value: 2,
        },
        new: {
            value: 5
        }
    }
};

exports.categoryUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-03-03",
        referenceMonth: "2020-03",
        txId: "202003030001",
        old: {
            categoryId: "01",
            value: 2,
        },
        new: {
            categoryId: "02",
        }
    }
};

exports.categoryAndValueUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-03-03",
        referenceMonth: "2020-03",
        txId: "202003030001",
        old: {
            categoryId: "01",
            value: 2,
        },
        new: {
            categoryId: "02",
            value: 5,
        }
    }
};

exports.multipleCategoriesUpdate = {
    'detail-type': 'transactions updated',
    detail: {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        changes: [
            {
                txDate: "2020-03-03",
                referenceMonth: "2020-03",
                txId: "202003030001",
                old: {
                    categoryId: "01",
                    value: 2,
                },
                new: {
                    categoryId: "02"
                }
            },
            {
                txDate: "2020-03-03",
                referenceMonth: "2020-03",
                txId: "202003030002",
                old: {
                    categoryId: "01",
                    value: 3,
                },
                new: {
                    categoryId: "02"
                }
            }
        ]
    }
};

exports.dbRangeKeysCat01 = [
    "METRIC#0001#Y#2020#01",
    "METRIC#0001#M#2020-03#01",
    "METRIC#0001#D#2020-03-03#01"
];

exports.dbRangeKeysCat02 = [
    "METRIC#0001#Y#2020#02",
    "METRIC#0001#M#2020-03#02",
    "METRIC#0001#D#2020-03-03#02"
];

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

exports.recalculateMetricsEvent = {
    httpMethod: "POST",
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
        accountId: this.ACCOUNT_ID,
        walletId: "0001",
    }
}

exports.retrieveMetricsResult = {
    Count: 7,
    Items: [
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-01#01" },
            count: {
                N: "1",
            },
            sum: { N: "3.5" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-02#01" },
            count: {
                N: "1",
            },
            sum: { N: "4.5" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-02#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#M#2020-01#01" },
            count: {
                N: "2",
            },
            sum: { N: "8" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#M#2020-01#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#Y#2020#01" },
            count: {
                N: "2",
            },
            sum: { N: "8" }
        },
        {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#Y#2020#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" }
        },
    ],
    ScannedCount: 7,
};

exports.deleteMetricsResults = this.retrieveMetricsResult.Items.map(item => {
    return {
        Attributes: item
    }
});

exports.queryTransactionsResult = {
    Count: 3,
    Items: [
        {
            PK: { "S": `ACCOUNT#${this.ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-01#202001010001" },
            accountId: { "S": this.ACCOUNT_ID, },
            walletId: { "S": "0001" },
            txDate: { "S": "2020-01-01" },
            txId: { "S": "202001010001" },
            dt: { "S": "2020-01-01T00:00:00.000Z" },
            value: { "N": "6.5" },
            description: { "S": "Transaction Test" },
            type: { "S": "POS" },
            balance: { "N": "1234.56" },
            balanceType: { "S": "Debit" },
            includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
            version: { "N": 1 },
            categoryId: { "S": "01"},
            keyword: { "S": "Transaction"},
            source: { "S": "JOHNDOE12345678-20200107.csv"},
            sourceType: {"S": "A"},
            referenceMonth: {"S": "2020-01"}
        },
        {
            PK: { "S": `ACCOUNT#${this.ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-02#202001020002" },
            accountId: { "S": this.ACCOUNT_ID },
            walletId: { "S": "0001" },
            txDate: { "S": "2020-01-02" },
            txId: { "S": "202001020002" },
            dt: { "S": "2020-01-02T00:00:00.000Z" },
            value: { "N": "3.5" },
            description: { "S": "A Transaction Test" },
            type: { "S": "POS" },
            balance: { "N": "156.83" },
            balanceType: { "S": "Debit" },
            includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
            version: { "N": 1 },
            categoryId: { "S": "01"},
            keyword: { "S": "Transaction"},
            source: { "S": "JOHNDOE12345678-20200107.csv"},
            sourceType: {"S": "A"},
            referenceMonth: {"S": "2020-01"}
        },
        {
            PK: { "S": `ACCOUNT#${this.ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-02#202001020001" },
            accountId: { "S": this.ACCOUNT_ID },
            walletId: { "S": "0001" },
            txDate: { "S": "2020-01-02" },
            txId: { "S": "202001020001" },
            dt: { "S": "2020-01-02T00:00:00.000Z" },
            value: { "N": "9" },
            description: { "S": "Transaction Test" },
            type: { "S": "POS" },
            balance: { "N": "33.77" },
            balanceType: { "S": "Debit" },
            includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
            version: { "N": 1 },
            categoryId: { "S": "10"},
            keyword: { "S": "Transaction"},
            source: { "S": "JOHNDOE12345678-20200107.csv"},
            sourceType: {"S": "A"},
            referenceMonth: {"S": "2020-01"}
        }
    ],
    ScannedCount: 3
};

exports.metricUpdateItemsResults = [
    {
        "Attributes": {
            "sum": {
                "N": "10"
            },
            "count": {
                "N": "2"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#Y#2020#01"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "10"
            },
            "count": {
                "N": "2"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#M#2020-01#01"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "6.5"
            },
            "count": {
                "N": "1"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-01#01"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "3.5"
            },
            "count": {
                "N": "1"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-02#01"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "9"
            },
            "count": {
                "N": "1"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#Y#2020#10"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "9"
            },
            "count": {
                "N": "1"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#M#2020-01#10"
            }
        }
    },
    {
        "Attributes": {
            "sum": {
                "N": "9"
            },
            "count": {
                "N": "1"
            },
            "PK": {
                "S": `ACCOUNT#${this.ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-02#10"
            }
        }
    },
]

exports.DynamoDbMock = class {

    constructor(paramsValidators = [], returnValues = []) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
        this.query = this.mock;
        this.batchWriteItems = this.mock;
        this.putItem = this.mock;
        this.deleteItem = this.mock;
        this.updateItem = this.mock;
    }

    mock(params) {
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