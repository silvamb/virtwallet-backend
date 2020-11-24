exports.CLIENT_ID = "ef471999-eb8f-5bc5-b39d-037e99f341c4";
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.WALLET_ID = "0002";

exports.newWalletEvent = {
    httpMethod: 'POST',
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID
            }
        }
    },
    pathParameters: {
        accountId: this.ACCOUNT_ID
    },
    body: JSON.stringify({
        name: "Wallet Name",
        description: "Wallet Description",
        type: "checking_account"
    })
};

exports.listWalletsEvent = {
    httpMethod: 'GET',
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID
            }
        }
    },
    pathParameters: {
        accountId: this.ACCOUNT_ID
    }
};

exports.getWalletsEvent = {
    httpMethod: 'GET',
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID
            }
        }
    },
    pathParameters: {
        accountId: this.ACCOUNT_ID,
        walletId: this.WALLET_ID
    }
};

exports.updateWalletEventBody = {
    old: {
        "name": "oldName",
        "description": "oldDesc"
    },
    new: {
        "name": "newName",
        "description": "newDesc"
    }
};

exports.updateWalletEvent = {
    httpMethod: 'PUT',
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID
            }
        }
    },
    pathParameters: {
        accountId: this.ACCOUNT_ID,
        walletId: this.WALLET_ID
    },
    body: JSON.stringify(this.updateWalletEventBody),
};

exports.expectedWalletCountQueryResult = {
    Count: 1,
    ScannedCount: 1
}

exports.putItemResult = {
    ConsumedCapacity: {
        TableName: 'virtwallet-dev',
        CapacityUnits: 1
    } 
  }

exports.expectedListWalletsResult = {
    Count: 1,
    Items: [
        {
            PK: {"S": `ACCOUNT#${this.ACCOUNT_ID}`},
            SK: {"S": `WALLET#${this.ACCOUNT_ID}#${this.WALLET_ID}`},
            accountId:  {"S": this.ACCOUNT_ID},
            walletId:  {"S": this.WALLET_ID},
            ownerId:  {"S": this.CLIENT_ID},
            type: {"S": "checking_account"},
            name: {"S": "Wallet Name"},
            description: {"S": "Wallet Description"},
            versionId: {"N": "1"}
        }
    ],
    ScannedCount: 1
};

exports.updateWalletResult = {
    Attributes: {
        PK: {
            S: `ACCOUNT#${this.ACCOUNT_ID}`,
        },
        SK: { S: `WALLET#${this.ACCOUNT_ID}#${this.WALLET_ID}` },
        accountId: {
            S: this.ACCOUNT_ID,
        },
        walletId: { S: this.WALLET_ID },
        ownerId:  {S: this.CLIENT_ID},
        type: {S: "checking_account"},
        name: { S: "newName" },
        description: { S: "newDesc" },
        versionId: { N: "2" },
    }
};

exports.versionUpdateResult = {
    Attributes: {
        version: {"N": "7"}
    }
}

exports.DynamoDbMock = class {

    constructor(paramsValidators = [], returnValues = [exports.putItemResult]) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
        this.query = this.mock;
        this.batchWriteItems = this.mock;
        this.putItem = this.mock;
        this.deleteItem = this.mock;
        this.updateItem = this.mock;
    }
  
    mock(params) {
        const validator = this.paramsValidators.pop();
  
        if(!validator) {
          throw new Error(`Unexpected call with params: ${JSON.stringify(params)}`);
        }
  
        validator(params);
  
        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
  }

exports.expectedNewWalletVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: [{
            type: "Wallet",
            PK: `ACCOUNT#${this.ACCOUNT_ID}`,
            SK: `WALLET#${this.ACCOUNT_ID}#${this.WALLET_ID}`,
            op: "Add"
        }]
    })
}

exports.expectedUpdateWalletVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 7,
        changeSet: [{
            type: "Wallet",
            PK: `ACCOUNT#${this.ACCOUNT_ID}`,
            SK: `WALLET#${this.ACCOUNT_ID}#${this.WALLET_ID}`,
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
  
  exports.EventBridgeMock = class {
    constructor(paramsValidators = [], returnValues = [exports.expectedPutEventResult]) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
    }
  
    putEvents(params){
        const validator = this.paramsValidators.pop();
        validator(params);
  
        return {
            promise: () => {
                return Promise.resolve(this.returnValues.pop());
            }
        }
    }
  }

exports.expectedWallet = {
    accountId: this.ACCOUNT_ID,
    walletId: this.WALLET_ID,
    ownerId: this.CLIENT_ID,
    type: "checking_account",
    name: "Wallet Name",
    description: "Wallet Description",
    versionId: 1
};