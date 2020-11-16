
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.WALLET_ID = "0001";
exports.CLIENT_ID = "10v21l6b17g3t27sfbe38b0i8n";

exports.transactionsToCreate = [
    {
        txDate: '2020-09-19',
        txId: '202009210011',
        dt: '2020-09-21T00:00:00Z',
        value: '20.50',
        description: 'Transaction 1',
        type: 'POS',
        balance: '895.43',
        balanceType: 'Debit',
        version: 1,
        categoryId: '02',
        keyword: 'Transaction 1',
        referenceMonth: '202009',
      },
      {
        txDate: '2020-09-18',
        txId: '202009210012',
        dt: '2020-09-21T00:00:00Z',
        value: '3.49',
        description: 'Transaction 2',
        type: 'POS',
        balance: '915.93',
        balanceType: 'Debit',
        version: 1,
        categoryId: '05',
        keyword: 'Transaction 2',
        referenceMonth: '2020-09',
      },
      {
        txDate: '2020-09-19',
        txId: '202009210013',
        dt: '2020-09-21T00:00:00Z',
        value: '18.31',
        description: 'Transaction 3',
        type: 'POS',
        balance: '919.42',
        balanceType: 'Debit',
        version: 1,
        categoryId: '01',
        keyword: 'Transaction 3',
        referenceMonth: '2020-09',
      },
];

exports.createTransactionsEvent = {
    httpMethod: "PUT",
    requestContext: {
        authorizer: {
            claims: {
                aud: this.CLIENT_ID
            }
        }
    },
    queryStringParameters:{},
    pathParameters: {
        accountId: this.ACCOUNT_ID,
        walletId: this.WALLET_ID
    },
    body: JSON.stringify(this.transactionsToCreate)
}

exports. createTransactionsParameters = {
    clientId: this.CLIENT_ID,
    accountId: this.ACCOUNT_ID,
    walletId: this.WALLET_ID,
    txId: this.createTransactionsEvent.pathParameters.txId,
    transactions: this.transactionsToCreate,
    to: this.createTransactionsEvent.queryStringParameters,
    from: this.createTransactionsEvent.queryStringParameters
};

exports.putItemResult = {
    ConsumedCapacity: {
        TableName: "virtwallet-dev",
        CapacityUnits: 1
    }
}

exports.createTransactionsUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: this.transactionsToCreate.map(transaction => {
            return  {
                type: "Transaction",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: `TX#0001#${transaction.txDate}#${transaction.txId}`,
                op: "Add"
            }
        })
    })
}