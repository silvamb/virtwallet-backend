exports.ACCOUNT_ID = "4811b387618c0-4277-98e9-ba34210bdcf3";

const TABLE_NAME = 'virtwallet';


function generateReturnValue(date) {
    return {
        Attributes: {
            PK: {
                S: "ACCOUNT#"+exports.ACCOUNT_ID,
            },
            SK: { S: date },
            count: {
                N: "50",
            },
            sum: { N: "187" },
            versionId: {N : "7"}
        }
    }
}

exports.sameDayAndCategoryUpdateEvent = {
    'detail-type': 'transactions created',
    detail: {
        transactions: [
            {
                accountId: exports.ACCOUNT_ID,
                walletId: '0001',
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: "4",
                categoryId: "01"
            },
            {
                accountId: exports.ACCOUNT_ID,
                walletId: '0001',
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: "5",
                categoryId: "01"
            }
        ]
    }
};

exports.sameDayAndCategoryUpdateQueryParams = [
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "9"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "9"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-02#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "9"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-02-01#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    }
];

const sameDayAndCategoryUpdateSKs = ["METRIC#0001#Y#2020#01", "METRIC#0001#M#2020-02#01", "METRIC#0001#D#2020-02-01#01"];

exports.sameDayAndCategoryUpdateResult = sameDayAndCategoryUpdateSKs.map(generateReturnValue);

exports.sameDayAndCategoryMetricUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.sameDayAndCategoryUpdateResult.map(result => {
            return  {
                type: "Metrics",
                PK: result.Attributes.PK.S,
                SK: result.Attributes.SK.S,
                op: "Update"
            }
        })
    })
}

exports.valueUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: this.ACCOUNT_ID,
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

exports.valueUpdateQueryParams = [
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "0"}, ':sum': {N: "3"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "0"}, ':sum': {N: "3"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "0"}, ':sum': {N: "3"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
];

const valueUpdateSKs = ["METRIC#0001#Y#2020#01", "METRIC#0001#M#2020-03#01", "METRIC#0001#D#2020-03-03#01"];

exports.valueUpdateUpdateResult = valueUpdateSKs.map(generateReturnValue);

exports.valueUpdateUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.valueUpdateUpdateResult.map(result => {
            return  {
                type: "Metrics",
                PK: result.Attributes.PK.S,
                SK: result.Attributes.SK.S,
                op: "Update"
            }
        })
    })
}

exports.categoryUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: this.ACCOUNT_ID,
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

exports.categoryUpdateQueryParams = [
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
];

const categoryUpdateSKs = [
    "METRIC#0001#Y#2020#01", "METRIC#0001#Y#2020#02", 
    "METRIC#0001#M#2020-03#01", "METRIC#0001#M#2020-03#02",
    "METRIC#0001#D#2020-03-03#01", "METRIC#0001#D#2020-03-03#02"
];

exports.categoryUpdateResult = categoryUpdateSKs.map(generateReturnValue);

exports.categoryUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.categoryUpdateResult.map(result => {
            return  {
                type: "Metrics",
                PK: result.Attributes.PK.S,
                SK: result.Attributes.SK.S,
                op: "Update"
            }
        })
    })
}

exports.categoryAndValueUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: this.ACCOUNT_ID,
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


exports.categoryAndValueUpdateQueryParams = [
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-1"}, ':sum': {N: "-2"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "1"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
];

const categoryAndValueUpdateSKs = [
    "METRIC#0001#Y#2020#01", "METRIC#0001#Y#2020#02", 
    "METRIC#0001#M#2020-03#01", "METRIC#0001#M#2020-03#02",
    "METRIC#0001#D#2020-03-03#01", "METRIC#0001#D#2020-03-03#02"
];

exports.categoryAndValueUpdateResult = categoryAndValueUpdateSKs.map(generateReturnValue);

exports.categoryAndValueUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.categoryAndValueUpdateResult.map(result => {
            return  {
                type: "Metrics",
                PK: result.Attributes.PK.S,
                SK: result.Attributes.SK.S,
                op: "Update"
            }
        })
    })
}

exports.multipleCategoriesUpdateEvent = {
    'detail-type': 'transactions updated',
    detail: {
        accountId: exports.ACCOUNT_ID,
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

exports.multipleCategoriesUpdateQueryParams = [
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-2"}, ':sum': {N: "-5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#Y#2020#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-2"}, ':sum': {N: "-5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#M#2020-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "-2"}, ':sum': {N: "-5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#01"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
    {
        ExpressionAttributeNames: { '#count': 'count', '#sum': 'sum' },
        ExpressionAttributeValues: { ':count': {N: "2"}, ':sum': {N: "5"}  },
        Key: { PK: {S: "ACCOUNT#"+this.ACCOUNT_ID}, SK: {S: "METRIC#0001#D#2020-03-03#02"} },
        ReturnValues: 'ALL_NEW',
        TableName: TABLE_NAME,
        UpdateExpression: 'ADD #count :count,#sum :sum '
    },
];

const multipleCategoriesUpdateSKs = [
    "METRIC#0001#Y#2020#01", "METRIC#0001#Y#2020#02", 
    "METRIC#0001#M#2020-03#01", "METRIC#0001#M#2020-03#02",
    "METRIC#0001#D#2020-03-03#01", "METRIC#0001#D#2020-03-03#02"
];

exports.multipleCategoriesUpdateResult = multipleCategoriesUpdateSKs.map(generateReturnValue);

exports.multipleCategoriesUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.multipleCategoriesUpdateResult.map(result => {
            return  {
                type: "Metrics",
                PK: result.Attributes.PK.S,
                SK: result.Attributes.SK.S,
                op: "Update"
            }
        })
    })
}