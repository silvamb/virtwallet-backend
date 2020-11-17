exports.ACCOUNT_ID = "a03af6a8-e246-410a-8ca5-bfab980648cc";

exports.expectedAccount = {
    Count: 1,
    Items: [
        {
            PK: {"S": "USER#ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            SK: {"S": "ACCOUNT#ef471999-eb8f-5bc5-b39d-037e99f341c4#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            accountId:  {"S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            ownerId:  {"S": "ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            name: {"S": "Account Name"},
            description: {"S": "Account Description"}
        }
    ],
    ScannedCount: 2
};

exports.singleTransactionsEvent = {
    account: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
    wallet: '0001',
    parserName: 'ulster_csv_parser',
    fileName: 'myfile.csv',
    bucketName: 'my-bucket',
    objectKey: 'account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv',
    transactions: [{
        txDate: "2020-01-01",
        txId: "202001010001",
        dt: "2020-01-01T00:00:00.000Z",
        value: "5.27",
        description: "Transaction1",
        type: "GSD",
        balance: "4000",
        balanceType: "Debit",
        categoryId: "04"
    }]
};

exports.multiTransactionsEvent = {
    account: 'a03af6a8-e246-410a-8ca5-bfab980648cc',
    wallet: '0001',
    parserName: 'ulster_csv_parser',
    fileName: 'myfile.csv',
    bucketName: 'my-bucket',
    objectKey: 'account-files/a03af6a8-e246-410a-8ca5-bfab980648cc/0001/parsers/ulster_csv_parser/myfile.csv',
    transactions: [{
        txDate: "2020-01-01",
        txId: "202001010001",
        dt: "2020-01-01T00:00:00.000Z",
        value: "5.27",
        description: "Transaction1",
        type: "GSD",
        balance: "4000",
        balanceType: "Debit",
        categoryId: "04",
        keyword: "Transaction1"
    },
    {
        txDate: "2020-01-01",
        txId: "202001010002",
        dt: "2020-01-02T00:00:00.000Z",
        value: "15.32",
        description: "Transaction2", 
        type: "POS",
        balance: "1000",
        balanceType: "Debit",
        categoryId: "06",
        keyword: "Transaction2"
    }]
};

exports.singleTransactionsCreatedEvent = {
    transactions: [
        {
            accountId: "a03af6a8-e246-410a-8ca5-bfab980648cc",
            walletId: "0001",
            txDate: "2020-01-01",
            value: "5.27",
            categoryId: "04",
            referenceMonth: "2020-01",
        }
    ]
};

exports.multiTransactionsCreatedEvent = {
    transactions: [
        {
            accountId: "a03af6a8-e246-410a-8ca5-bfab980648cc",
            walletId: "0001",
            txDate: "2020-01-01",
            value: "5.27",
            categoryId: "04",
            referenceMonth: "2020-01",
        },
        {
            accountId: "a03af6a8-e246-410a-8ca5-bfab980648cc",
            walletId: "0001",
            txDate: "2020-01-01",
            value: "15.32",
            categoryId: "06",
            referenceMonth: "2020-01",
        }
    ]
};

const transactionItems = [
    {
        PK: { "S": "ACCOUNT#a03af6a8-e246-410a-8ca5-bfab980648cc" },
        SK: { "S": "TX#0001#2020-01-01#202001010001" },
        accountId: { "S": "a03af6a8-e246-410a-8ca5-bfab980648cc" },
        walletId: { "S": "0001" },
        txDate: { "S": "2020-01-01" },
        txId: { "S": "202001010001" },
        dt: { "S": "2020-01-01T00:00:00.000Z" },
        value: { "N": "5.27" },
        description: { "S": "Transaction1" },
        type: { "S": "GSD" },
        balance: { "N": "4000" },
        balanceType: { "S": "Debit" },
        includedBy: { "S": "NOT_DEFINED"},
        versionId: { "N": 1 },
        categoryId: { "S": "04"},
        keyword: { "S": "Transaction1"},
        source: { "S": "myfile.csv"},
        sourceType: {"S": "A"},
        referenceMonth: {"S": "2020-01"}
    },
    {
        PK: { "S": "ACCOUNT#a03af6a8-e246-410a-8ca5-bfab980648cc" },
        SK: { "S": "TX#0001#2020-01-01#202001010002" },
        accountId: { "S": "a03af6a8-e246-410a-8ca5-bfab980648cc" },
        walletId: { "S": "0001" },
        txDate: { "S": "2020-01-01" },
        txId: { "S": "202001010002" },
        dt: { "S": "2020-01-01T00:00:00.000Z" },
        value: { "N": "15.32" },
        description: { "S": "Transaction2" },
        type: { "S": "POS" },
        balance: { "N": "1000" },
        balanceType: { "S": "Debit" },
        includedBy: { "S": "NOT_DEFINED"},
        versionId: { "N": 1 },
        categoryId: { "S": "06"},
        keyword: { "S": "Transaction2"},
        source: { "S": "myfile.csv"},
        sourceType: {"S": "A"},
        referenceMonth: {"S": "2020-01"}
    },
];


exports.putItemParamsForTx1 = {
    Item: transactionItems[0],
    ReturnConsumedCapacity: "TOTAL",
    TableName: 'virtwallet-dev',
    ReturnValues: "ALL_OLD",
    ConditionExpression: 'attribute_not_exists(PK)'
};

exports.putItemTransaction2 = {
    Item: transactionItems[1],
    ReturnConsumedCapacity: "TOTAL",
    TableName: 'virtwallet-dev',
    ReturnValues: "ALL_OLD",
    ConditionExpression: 'attribute_not_exists(PK)'
};

exports.expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};

exports.currentMonthRule = {
    currentMonth: true,
    dayOfMonth: 5,
    manuallySetPeriods: []
}

exports.expectedAccountWithStartDate = {
    Count: 1,
    Items: [
        {
            PK: {"S": "USER#ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            SK: {"S": "ACCOUNT#ef471999-eb8f-5bc5-b39d-037e99f341c4#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            accountId:  {"S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            ownerId:  {"S": "ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            name: {"S": "Account Name"},
            description: {"S": "Account Description"},
            monthStartDateRule: {"S": JSON.stringify({
                currentMonth: true,
                dayOfMonth: 5,
                manuallySetPeriods: []
            })}

        }
    ],
    ScannedCount: 2
};

exports.expectedAccountWithManuallySetStartDate = {
    Count: 1,
    Items: [
        {
            PK: {"S": "USER#ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            SK: {"S": "ACCOUNT#ef471999-eb8f-5bc5-b39d-037e99f341c4#ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            accountId:  {"S": "ad7d4de0-184a-4d3d-a4c8-68d5ba87b87f"},
            ownerId:  {"S": "ef471999-eb8f-5bc5-b39d-037e99f341c4"},
            name: {"S": "Account Name"},
            description: {"S": "Account Description"},
            monthStartDateRule: {"S": JSON.stringify({
                currentMonth: false,
                dayOfMonth: 25,
                manuallySetPeriods: [
                    {
                        startDate: "2019-12-20",
                        endDate: "2020-01-23",
                        month: "2020-01"
                    }
                ]
            })}

        }
    ],
    ScannedCount: 2
};

exports.EventBridgeMock = class {
    constructor(paramsValidators = [], returnValues = []) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
    }

    putEvents(params){
        const validator = this.paramsValidators.pop();
        validator(params);

        return {
            promise: () => {
                const returnValue = this.returnValues.pop() || exports.expectedPutEventResult;

                return Promise.resolve(returnValue);
            }
        }
    }
}

exports.versionUpdateResult = {
    Attributes: {
        accountId: this.ACCOUNT_ID,
        version: {"N": "7"}
    }
}

exports.createSingleTransactionUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.singleTransactionsEvent.transactions.map(transaction => {
            return  {
                type: "Transaction",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: `TX#0001#${transaction.txDate}#${transaction.txId}`,
                op: "Add"
            }
        })
    })
}

exports.createMultipleTransactionUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.multiTransactionsEvent.transactions.map(transaction => {
            return  {
                type: "Transaction",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: `TX#0001#${transaction.txDate}#${transaction.txId}`,
                op: "Add"
            }
        })
    })
}