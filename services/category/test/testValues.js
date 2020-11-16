
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.CLIENT_ID = "ef471999-eb8f-5bc5-b39d-037e99f341c4";
exports.CATEGORY_ID = "05";

exports.createCategoryEvent = {
    resource: "/account/{accountId}/category",
    httpMethod: "POST",
    pathParameters: { accountId: this.ACCOUNT_ID },
    body: JSON.stringify([
        {
            name: "Category Name",
            description: "Category Description",
        },
    ]),
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID,
            },
        },
    },
};

exports.createTwoCategoriesEvent = {
    resource: "/account/{accountId}/category",
    httpMethod: "POST",
    pathParameters: { accountId: this.ACCOUNT_ID },
    body: JSON.stringify([
        {
            name: "Category 1 Name",
            description: "Category 1 Description",
        },
        {
            name: "Category 2 Name",
            description: "Category 2 Description",
        },
    ]),
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID,
            },
        },
    },
};

exports.listCategoriesEvent = {
    resource: "/account/{accountId}/category",
    httpMethod: "GET",
    pathParameters: { accountId: this.ACCOUNT_ID },
    body: null,
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID,
            },
        },
    },
};

exports.getCategoryEvent = {
    resource: "/account/{accountId}/category/{categoryId}",
    httpMethod: "GET",
    pathParameters: {
        accountId: this.ACCOUNT_ID,
        categoryId: this.CATEGORY_ID,
    },
    body: null,
    requestContext: {
        authorizer: {
            claims: {
                sub: this.CLIENT_ID,
            },
        },
    },
};

exports.emptyQueryResult = {
    Count: 0,
    ScannedCount: 0,
}

exports.putItemResult = {
    ConsumedCapacity: {
        TableName: 'virtwallet-dev',
        CapacityUnits: 1
    } 
}

exports.createCategoryResults = [
    {
        success: true,
        data: this.putItemResult
    }
]

exports.queryResult = {
    Count: 1,
    Items: [
        {
            PK: {
                S: `ACCOUNT#${this.ACCOUNT_ID}`,
            },
            SK: { S: "CATEGORY#01" },
            accountId: {
                S: this.ACCOUNT_ID,
            },
            categoryId: { S: "01" },
            name: { S: "Category Name" },
            description: { S: "Category Description" },
            versionId: 1
        },
    ],
    ScannedCount: 1,
}

exports.expectedList = [{
    accountId: this.ACCOUNT_ID,
    categoryId: "01",
    name: "Category Name",
    description: "Category Description",
    versionId: 1
}]

exports.expectedSingleCategoryResult = [{
    data: {
        accountId: this.ACCOUNT_ID,
        categoryId: "01",
        name: "Category Name",
        description: "Category Description",
        versionId: 1
    }
}]

exports.expectedMultipleCategoryResult = [
    {
        data: {
            accountId: this.ACCOUNT_ID,
            categoryId: "01",
            name: "Category 1 Name",
            description: "Category 1 Description",
            versionId: 1
        }
    },
    {
        data: {
            accountId: this.ACCOUNT_ID,
            categoryId: "02",
            name: "Category 2 Name",
            description: "Category 2 Description",
            versionId: 1
        }
    }
]

exports.versionUpdateResult = {
    Attributes: {
        accountId: this.ACCOUNT_ID,
        version: {"N": "5"}
    }
}

exports.expectedVersionEvent = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 5,
        changeSet: [{
            type: "Category",
            PK: `ACCOUNT#${this.ACCOUNT_ID}`,
            SK: "CATEGORY#01",
            op: "Add"
        }]
    })
}

exports.expectedVersionEventMultipleCat = {
    Source:"virtwallet",
    DetailType: "new account version",
    Detail: JSON.stringify({
        accountId: this.ACCOUNT_ID,
        version: 5,
        changeSet: [
            {
                type: "Category",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: "CATEGORY#01",
                op: "Add"
            },
            {
                type: "Category",
                PK: `ACCOUNT#${this.ACCOUNT_ID}`,
                SK: "CATEGORY#02",
                op: "Add"
            }
        ]
    })
}

exports.expectedPutEventResult = {
    FailedEntryCount: 0, 
    Entries: [{
        EventId: "11710aed-b79e-4468-a20b-bb3c0c3b4860"
    }]
};

exports.DynamoDbMock = class {

    constructor(paramsValidators = [], returnValues = []) {
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
        validator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}

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
                return Promise.resolve(this.returnValues.pop());
            }
        }
    }
}