
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.CLIENT_ID = "10v21l6b17g3t27sfbe38b0i8n";
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
                aud: this.CLIENT_ID,
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
                aud: this.CLIENT_ID,
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
                aud: this.CLIENT_ID,
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
                aud: this.CLIENT_ID,
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
        TableName: 'virtwallet',
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
        },
    ],
    ScannedCount: 1,
}

exports.expectedList = [{
    accountId: this.ACCOUNT_ID,
    categoryId: "01",
    name: "Category Name",
    description: "Category Description",
    version: 1
}]

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