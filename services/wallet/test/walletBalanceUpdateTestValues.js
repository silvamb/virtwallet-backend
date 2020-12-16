const { ACCOUNT_ID, CLIENT_ID, WALLET_ID } = require('./testValues')

exports.transactionsCreatedEvent = {
    'detail-type': 'transactions created',
    detail: {
        transactions: [
            {
                accountId: ACCOUNT_ID,
                walletId: WALLET_ID,
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: 4,
                categoryId: "01"
            },
            {
                accountId: ACCOUNT_ID,
                walletId: WALLET_ID,
                txDate: "2020-02-01",
                referenceMonth: "2020-02",
                value: 5,
                categoryId: "01"
            }
        ]
    }
};

exports.transactionUpdateEvent = {
    'detail-type': 'transaction updated',
    detail: {
        accountId: ACCOUNT_ID,
        walletId: WALLET_ID,
        txDate: "2020-03-03",
        referenceMonth: "2020-03",
        txId: "202003030001",
        old: {
            categoryId: "01",
            value: 3,
        },
        new: {
            value: 12
        }
    }
};

exports.transactionsUpdateEvent = {
    'detail-type': 'transactions updated',
    detail: {
        accountId: ACCOUNT_ID,
        walletId: WALLET_ID,
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
                    value: 1,
                },
                new: {
                    value: 5
                }
            },
            {
                txDate: "2020-03-03",
                referenceMonth: "2020-03",
                txId: "202003030003",
                old: {
                    value: 3,
                },
                new: {
                    value: 8
                }
            },
            {
                txDate: "2020-03-03",
                referenceMonth: "2020-03",
                txId: "202003030004",
                old: {
                    description: "tx 1",
                },
                new: {
                    description: "tx 2",
                }
            }
        ]
    }
};

exports.updateWalletBalanceParams = {
    ExpressionAttributeNames: { 
        '#balance': 'balance',
        '#versionId': 'versionId'
    },
    ExpressionAttributeValues: {
        ':balance': {
            N: "9"
        }, 
        ':versionId': {
            N: "1"
        }
    },
    Key: {
        PK: {
            S: `ACCOUNT#${ACCOUNT_ID}`
        },
        SK: {
            S: `WALLET#${ACCOUNT_ID}#${WALLET_ID}`
        }
    },
    UpdateExpression: 'ADD #balance :balance,#versionId :versionId'
};

exports.expectedUpdatedWallet = {
    accountId: ACCOUNT_ID,
    walletId: WALLET_ID,
    ownerId: CLIENT_ID,
    type: "checking_account",
    name: "newName",
    description: "newDesc",
    versionId: 2,
    balance: 1234
};

exports.walletUpdatedEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: ACCOUNT_ID,
        version: 7,
        changeSet: [
            {
                type: "Wallet",
                PK: `ACCOUNT#${ACCOUNT_ID}`,
                SK: `WALLET#${ACCOUNT_ID}#${WALLET_ID}`,
                op: "Update"
            }
        ]
    })
}