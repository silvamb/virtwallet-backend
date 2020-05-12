const listTransactionsParams = {
    clientId: "10v21l6b17g3t27sfbe38b0i8n",
    accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
    walletId: "0001",
    from: "2020-01-01",
    to: "2020-01-18"
};

exports.listTransactionsParams = listTransactionsParams;

exports.orderTestAscParams = Object.assign({order:"ASC"}, listTransactionsParams);

exports.orderTestDescParams = Object.assign({order:"DESC"}, listTransactionsParams);

const transactionItems = [
    {
        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
        SK: { "S": "TX#0001#2020-01-01#202001010001" },
        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
        walletId: { "S": "0001" },
        txDate: { "S": "2020-01-01" },
        txId: { "S": "202001010001" },
        dt: { "S": "2020-01-01T00:00:00.000Z" },
        value: { "N": "19.9" },
        description: { "S": "Transaction Test" },
        type: { "S": "POS" },
        balance: { "N": "1234.56" },
        balanceType: { "S": "Debit" },
        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
        version: { "N": 1 },
        categoryId: { "S": "18"},
        keyword: { "S": "Transaction"},
        source: { "S": "JOHNDOE12345678-20200107.csv"},
        sourceType: {"S": "A"}
    },
    {
        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
        SK: { "S": "TX#0001#2020-01-02#202001020002" },
        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
        walletId: { "S": "0001" },
        txDate: { "S": "2020-01-02" },
        txId: { "S": "202001020002" },
        dt: { "S": "2020-01-02T00:00:00.000Z" },
        value: { "N": "87.9" },
        description: { "S": "A Transaction Test" },
        type: { "S": "POS" },
        balance: { "N": "156.83" },
        balanceType: { "S": "Debit" },
        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
        version: { "N": 1 },
        categoryId: { "S": "01"},
        keyword: { "S": "Transaction"},
        source: { "S": "JOHNDOE12345678-20200107.csv"},
        sourceType: {"S": "A"}
    },
    {
        PK: { "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
        SK: { "S": "TX#0001#2020-01-02#202001020001" },
        accountId: { "S": "4801b837-18c0-4277-98e9-ba57130edeb3" },
        walletId: { "S": "0001" },
        txDate: { "S": "2020-01-02" },
        txId: { "S": "202001020001" },
        dt: { "S": "2020-01-02T00:00:00.000Z" },
        value: { "N": "21.43" },
        description: { "S": "Transaction Test" },
        type: { "S": "POS" },
        balance: { "N": "33.77" },
        balanceType: { "S": "Debit" },
        includedBy: { "S": "10v21l6b17g3t27sfbe38b0i8n"},
        version: { "N": 1 },
        categoryId: { "S": "10"},
        keyword: { "S": "Transaction"},
        source: { "S": "JOHNDOE12345678-20200107.csv"},
        sourceType: {"S": "A"}
    }
];

exports.listTestDbResponse = {
    Count: 1,
    Items: [transactionItems[0]],
    ScannedCount: 1
};

exports.orderTestDbResponse = {
    Count: 3,
    Items: transactionItems,
    ScannedCount: 3
};

const transactionsList = [
    {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-01-01",
        txId: "202001010001",
        dt: "2020-01-01T00:00:00.000Z",
        value: "19.9",
        description: "Transaction Test",
        type: "POS",
        balance: "1234.56",
        balanceType: "Debit",
        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
        version: 1,
        categoryId: "18",
        keyword: "Transaction",
        source: "JOHNDOE12345678-20200107.csv",
        sourceType: "A"
    },
    {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-01-02",
        txId: "202001020001",
        dt: "2020-01-02T00:00:00.000Z",
        value: "21.43",
        description: "Transaction Test",
        type: "POS",
        balance: "33.77",
        balanceType: "Debit",
        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
        version: 1,
        categoryId: "10",
        keyword: "Transaction",
        source: "JOHNDOE12345678-20200107.csv",
        sourceType: "A"
    },
    {
        accountId: "4801b837-18c0-4277-98e9-ba57130edeb3",
        walletId: "0001",
        txDate: "2020-01-02",
        txId: "202001020002",
        dt: "2020-01-02T00:00:00.000Z",
        value: "87.9",
        description: "A Transaction Test",
        type: "POS",
        balance: "156.83",
        balanceType: "Debit",
        includedBy: "10v21l6b17g3t27sfbe38b0i8n",
        version: 1,
        categoryId: "01",
        keyword: "Transaction",
        source: "JOHNDOE12345678-20200107.csv",
        sourceType: "A"
    },
]

exports.listTestExpectedList = [transactionsList[0]];

exports.orderTestExpectedList = transactionsList;