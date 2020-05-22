exports.reclassifyTxEvent = {
    httpMethod: "GET",
    requestContext: {
        authorizer: {
            claims: {
                client_id: "10v21l6b17g3t27sfbe38b0i8n"
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
            includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n" },
            version: { "N": 1 },
            categoryId: { "S": "10" },
            keyword: { "S": "MyKeyword" },
            source: { "S": "JOHNDOE12345678-20200107.csv" },
            sourceType: { "S": "A" }
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
            categoryId:  {"S": "02"}
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
            categoryId:  {"S": "03"}
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
    "Attributes": {
        "categoryId": {
            "S": "01"
        },
        "PK": {
            "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
        },
        "SK": {
          "S": "TX#0001#2020-02-04#202002040001"
        }
    }
};