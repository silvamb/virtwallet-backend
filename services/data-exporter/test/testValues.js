const accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";

exports.accountId = accountId;

exports.event = {
    httpMethod: "POST",
    requestContext: {
        authorizer: {
            claims: {
                aud: "10v21l6b17g3t27sfbe38b0i8n"
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