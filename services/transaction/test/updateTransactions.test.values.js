
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.WALLET_ID = "0001";
exports.CLIENT_ID = "10v21l6b17g3t27sfbe38b0i8n";

exports.nonNotifiableAttrToUpdateTx = {
    txDate: "2020-02-04",
    old: {
        balance: 0.00,
        description: "No Desc"
    },
    new: {
        balance: 123.40,
        description: "Some Desc"
    }
};

exports.nonNotifiableAttrToUpdateTxEvent = {
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
        walletId: this.WALLET_ID,
        transactionId: "202002040001"
    },
    body: JSON.stringify(this.nonNotifiableAttrToUpdateTx)
}

exports.nonNotifiableAttrToUpdateTxParameters = {
    clientId: this.CLIENT_ID,
    accountId: this.ACCOUNT_ID,
    walletId: this.WALLET_ID,
    txDate: "2020-02-04",
    referenceMonth: "2020-02",
    txId: "202002040001",
    transactions: this.nonNotifiableAttrToUpdateTx
}

exports.nonNotifiableAttrToUpdateTxResult = {
    Attributes: {
        accountId: {"S": this.ACCOUNT_ID},
        balance: {"N": "123.4"},
        balanceType: {"S": "Debit"},
        categoryId: {"S": "04"},
        description: {"S": "Some Desc"},
        dt: {"S": "2020-02-04T00:00:00Z"},
        includedBy: {"S": this.CLIENT_ID},
        keyword: {"S": "Transaction 1"},
        PK: {"S": "ACCOUNT#"+this.ACCOUNT_ID},
        referenceMonth: {"S": "2020-02"},
        SK: {"S": "TX#0001#2020-02-04#202002040001"},
        source: {"S": "myFile.csv"},
        sourceType: {"S": "A"},
        txDate: {"S": "2020-02-04"},
        txId: {"S": "202002040001"},
        type: {"S": "POS"},
        value: {"N": "8.39"},
        version: {"N": "1"},
        walletId: {"S": "0001"}
    },
    ConsumedCapacity: 1
}

exports.putItemResult = {
    ConsumedCapacity: {
        TableName: "virtwallet-dev",
        CapacityUnits: 1
    }
}

exports.nonNotifiableAttrToUpdateTxUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: [
            {
                type: "Transaction",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: `TX#0001#${this.nonNotifiableAttrToUpdateTx.txDate}#202002040001`,
                op: "Update"
            }
        ]
    })
}

exports.notifiableAttrToUpdateTx = {
    txDate: "2020-02-03",
    old: {
        value: 1.50
    },
    new: {
        value: 2.90
    }
};

exports.notifiableAttrToUpdateTxEvent = {
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
        walletId: this.WALLET_ID,
        transactionId: "202002030001"
    },
    body: JSON.stringify(this.notifiableAttrToUpdateTx)
}

exports.notifiableAttrToUpdateTxParameters = {
    clientId: this.CLIENT_ID,
    accountId: this.ACCOUNT_ID,
    walletId: this.WALLET_ID,
    txDate: "2020-02-03",
    referenceMonth: "2020-02",
    txId: "202002030001",
    transactions: this.notifiableAttrToUpdateTx
}

exports.notifiableAttrToUpdateTxResult = {
    Attributes: {
        accountId: {"S": this.ACCOUNT_ID},
        balance: {"N": "123.4"},
        balanceType: {"S": "Debit"},
        categoryId: {"S": "04"},
        description: {"S": "Transaction 1"},
        dt: {"S": "2020-02-03T00:00:00Z"},
        includedBy: {"S": this.CLIENT_ID},
        keyword: {"S": "Transaction 1"},
        PK: {"S": "ACCOUNT#"+this.ACCOUNT_ID},
        referenceMonth: {"S": "2020-02"},
        SK: {"S": "TX#0001#2020-02-03#202002030001"},
        source: {"S": "myFile.csv"},
        sourceType: {"S": "A"},
        txDate: {"S": "2020-02-03"},
        txId: {"S": "202002030001"},
        type: {"S": "POS"},
        value: {"N": "2.9"},
        version: {"N": "1"},
        walletId: {"S": "0001"}
    },
    ConsumedCapacity: 1
}

exports.transactionUpdatedEvent = {
    Source:"virtwallet",
    DetailType: "transaction updated",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        walletId: this.WALLET_ID,
        txDate: "2020-02-03",
        referenceMonth: "2020-02",
        txId: "202002030001",
        old: {
            categoryId: "01",
            value: 1.5,
        },
        new: {
            value: 2.9
        }
    })
};

exports.notifiableAttrToUpdateTxUpdateVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: [
            {
                type: "Transaction",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: `TX#0001#${this.notifiableAttrToUpdateTx.txDate}#202002030001`,
                op: "Update"
            }
        ]
    })
}