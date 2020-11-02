const { ACCOUNT_ID } = require('./testValues')

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
        accountId: ACCOUNT_ID,
        walletId: "0001",
    }
}

exports.retrieveMetricsResult = {
    Count: 7,
    Items: [
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-01#01" },
            count: {
                N: "1",
            },
            sum: { N: "3.5" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-02#01" },
            count: {
                N: "1",
            },
            sum: { N: "4.5" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#D#2020-01-02#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#M#2020-01#01" },
            count: {
                N: "2",
            },
            sum: { N: "8" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#M#2020-01#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#Y#2020#01" },
            count: {
                N: "2",
            },
            sum: { N: "8" },
            versionId: {N : "7"}
        },
        {
            PK: {
                S: "ACCOUNT#"+ACCOUNT_ID,
            },
            SK: { S: "METRIC#0001#Y#2020#10" },
            count: {
                N: "1",
            },
            sum: { N: "5" },
            versionId: {N : "7"}
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
            PK: { "S": `ACCOUNT#${ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-01#202001010001" },
            accountId: { "S": ACCOUNT_ID, },
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
            referenceMonth: {"S": "2020-01"},
            versionId: 1
        },
        {
            PK: { "S": `ACCOUNT#${ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-02#202001020002" },
            accountId: { "S": ACCOUNT_ID },
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
            referenceMonth: {"S": "2020-01"},
            versionId: 1
        },
        {
            PK: { "S": `ACCOUNT#${ACCOUNT_ID}` },
            SK: { "S": "TX#0001#2020-01-02#202001020001" },
            accountId: { "S": ACCOUNT_ID },
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
            referenceMonth: {"S": "2020-01"},
            versionId: 1
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#Y#2020#01"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#M#2020-01#01"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-01#01"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-02#01"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#Y#2020#10"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#M#2020-01#10"
            },
            "versionId": { N : "1"}
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
                "S": `ACCOUNT#${ACCOUNT_ID}`
            },
            "SK": {
            "S": "METRIC#0001#D#2020-01-02#10"
            },
            "versionId": { N : "1"}
        }
    },
]