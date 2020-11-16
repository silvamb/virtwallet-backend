const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

exports.accountId = accountId;

exports.event = {
    httpMethod: "POST",
    requestContext: {
        authorizer: {
            claims: {
                sub: "ef471999-eb8f-5bc5-b39d-037e99f341c4"
            }
        }
    },
    pathParameters: {
        "accountId": accountId,
    }
};

exports.singleResult = {
    Count: 1,
    Items: [
        {
            PK: {
                S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3",
            },
            SK: { S: "CATEGORY#01" },
            accountId: {
                S: "4801b837-18c0-4277-98e9-ba57130edeb3",
            },
            categoryId: { S: "01" },
            name: { S: "Category Name" },
            description: { S: "Category Description" },
        },
    ],
    ScannedCount: 1,
};