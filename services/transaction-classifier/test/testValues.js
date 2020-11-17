exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";

exports.reclassifyTxEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                sub: "ef471999-eb8f-5bc5-b39d-037e99f341c4"
            }
        }
    },
    queryStringParameters:{
        from: "2020-03-01",
        to: "2020-03-02",
    },
    pathParameters: {
        "accountId": "4801b837-18c0-4277-98e9-ba57130edeb3",
        "walletId": "0001"
    }
};

exports.transactionItems = {
    Count: 1,
    Items: [
        {
            PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
            SK: { "S": "TX#0001#2020-01-01#202001010001" },
            accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
            walletId: { "S": "0001" },
            txDate: { "S": "2020-03-01" },
            txId: { "S": "202003010001" },
            dt: { "S": "2020-03-01T00:00:00.000Z" },
            value: { "N": "19.9" },
            description: { "S": "MyKeyword, Test" },
            type: { "S": "POS" },
            balance: { "N": "1234.56" },
            balanceType: { "S": "Debit" },
            includedBy: { "S": "ef471999-eb8f-5bc5-b39d-037e99f341c4" },
            versionId: { "N": 1 },
            categoryId: { "S": "10" },
            keyword: { "S": "MyKeyword" },
            source: { "S": "JOHNDOE12345678-20200107.csv" },
            sourceType: { "S": "A" },
            referenceMonth: {"S": "2020-03"},
        }
    ],
    ScannedCount: 1
};

exports.categoryRulesItems = {
    Count: 3,
    Items: [
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#KEYWORD#Transaction1"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            keyword:  {"S": "MyKeyword"},
            categoryId:  {"S": "01"},
            name: {"S": "Category Name"},
            versionId: {"N": 1}
        },
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#EXPRESSION#01"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            ruleId:  {"S": "02"},
            ruleType:  {"S": "contains"},
            parameter:  {"S": "Transaction"},
            name:  {"S": "Rule01"},
            priority: {"N": "30"},
            categoryId:  {"S": "02"},
            versionId: {"N": 1}
        },
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#EXPRESSION#01"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            ruleId:  {"S": "01"},
            ruleType:  {"S": "startsWith"},
            parameter:  {"S": "Transaction"},
            name:  {"S": "Rule01"},
            priority: {"N": "10"},
            categoryId:  {"S": "03"},
            versionId: {"N": 1}
        }
    ],
    ScannedCount: 3
};

exports.categoryRulesSingleItem = {
    Count: 1,
    Items: [
        {
            PK: {"S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"},
            SK: {"S": "RULE#KEYWORD#Transaction1"},
            accountId: {"S": "4801b837-18c0-4277-98e9-ba57130edeb3"},
            keyword:  {"S": "MyKeyword"},
            categoryId:  {"S": "10"},
            name: {"S": "Category Name"},
        }
    ],
    ScannedCount: 1
}

exports.updateTransactionResult = {
    Attributes: {
        accountId: {"S": this.ACCOUNT_ID},
        balance: {"N": "123.4"},
        balanceType: {"S": "Debit"},
        categoryId: {"S": "01"},
        description: {"S": "Transaction 1"},
        dt: {"S": "2020-03-01T00:00:00Z"},
        includedBy: {"S": this.CLIENT_ID},
        keyword: {"S": "Transaction 1"},
        PK: {"S": "ACCOUNT#"+this.ACCOUNT_ID},
        referenceMonth: {"S": "2020-02"},
        SK: {"S": "TX#0001#2020-03-01#202003010001"},
        source: {"S": "myFile.csv"},
        sourceType: {"S": "A"},
        txDate: {"S": "2020-03-01"},
        txId: {"S": "202003010001"},
        type: {"S": "POS"},
        value: {"N": "2.9"},
        versionId: {"N": "1"},
        walletId: {"S": "0001"}
    },
    ConsumedCapacity: 1
};

exports.expectedUpdateResult = [
    { 
        data: {
            accountId: this.ACCOUNT_ID,
            walletId: this.updateTransactionResult.Attributes.walletId.S,
            txDate: this.updateTransactionResult.Attributes.txDate.S,
            txId: this.updateTransactionResult.Attributes.txId.S,
            dt: this.updateTransactionResult.Attributes.dt.S,
            value: Number(this.updateTransactionResult.Attributes.value.N),
            description: this.updateTransactionResult.Attributes.description.S,
            type: this.updateTransactionResult.Attributes.type.S,
            balance: Number(this.updateTransactionResult.Attributes.balance.N),
            balanceType: this.updateTransactionResult.Attributes.balanceType.S,
            includedBy: this.updateTransactionResult.Attributes.includedBy.S,
            versionId: Number(this.updateTransactionResult.Attributes.versionId.N),
            categoryId: this.updateTransactionResult.Attributes.categoryId.S,
            keyword: this.updateTransactionResult.Attributes.keyword.S,
            source: this.updateTransactionResult.Attributes.source.S,
            sourceType: this.updateTransactionResult.Attributes.sourceType.S,
            referenceMonth: this.updateTransactionResult.Attributes.referenceMonth.S 
        }
    }
]

exports.versionUpdateResult = {
    Attributes: {
        accountId: this.ACCOUNT_ID,
        version: {"N": "7"}
    }
}

exports.expectedUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: [{
            type: "Transaction",
            PK: `ACCOUNT#${this.ACCOUNT_ID}`,
            SK: "TX#0001#2020-03-01#202003010001",
            op: "Update"
        }]
    })
  }

exports.expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};