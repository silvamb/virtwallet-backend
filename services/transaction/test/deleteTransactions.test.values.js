
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.WALLET_ID = "0001";
exports.CLIENT_ID = "ef471999-eb8f-5bc5-b39d-037e99f341c4";

exports.deleteTransactionsEvent = {
    httpMethod: "PUT",
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID
            }
        }
    },
    queryStringParameters:{},
    pathParameters: {
        accountId: this.ACCOUNT_ID,
        walletId: this.WALLET_ID
    }
}

exports.deleteTransactionsParameters = {
    clientId: this.CLIENT_ID,
    accountId: this.ACCOUNT_ID,
    walletId: this.WALLET_ID
}

exports.queryTransactionsResult = {
    "Items": [
        {
            "PK": {
                "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
            },
            "SK": {
                "S": "TX#0001#2019-12-30f#201912300011"
            }
        },
        {
            "PK": {
                "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
            },
            "SK": {
                "S": "TX#0001#2019-12-30#201912300012"
            }
        }
    ],
    "Count": 2,
    "ScannedCount": 2
};

exports.expectedDeleteParams = {
    RequestItems: {
        "virtwallet": [
            {
                DeleteRequest: {
                    Key: {
                        PK: this.queryTransactionsResult.Items[0].PK,
                        SK: this.queryTransactionsResult.Items[0].SK
                    }
                }
            },
            {
                DeleteRequest: {
                    Key: {
                        PK: this.queryTransactionsResult.Items[1].PK,
                        SK: this.queryTransactionsResult.Items[1].SK
                    }
                }
            }
        ]
    }
}

exports.deleteTransactionsResult = {
    "Items": [
        {
            "PK": {
                "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
            },
            "SK": {
                "S": "TX#0001#2019-12-30f#201912300011"
            }
        },
        {
            "PK": {
                "S": "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3"
            },
            "SK": {
                "S": "TX#0001#2019-12-30#201912300012"
            }
        }
    ],
    "Count": 2,
    "ScannedCount": 2
};