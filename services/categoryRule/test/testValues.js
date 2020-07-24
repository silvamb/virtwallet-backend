exports.clientId = "10v21l6b17g3t27sfbe38b0i8n";
exports.accountId = "4801b837-18c0-4277-98e9-ba57130edeb3";
exports.expectedKeyword = "some_keyword";
exports.expectedKeywordCategory = "03";
exports.expectedRuleType = "startsWith";
exports.expectedParameter = "value";
exports.expectedExpressionCategory = "02";
exports.expectedRuleName = "MyRule";
exports.expectedPriority = 1;

function generateCreateExpressionRuleEvent(rulesToAdd) {
  return {
    resource: "/account/{accountId}/categoryRule",
    httpMethod: "POST",
    pathParameters: { accountId: exports.accountId },
    body: JSON.stringify(rulesToAdd),
    requestContext: {
      authorizer: {
        claims: {
          aud: exports.clientId,
        },
      },
    },
  };
}

const validKeywordRule = [
  {
    ruleType: "keyword",
    keyword: exports.expectedKeyword,
    categoryId: exports.expectedKeywordCategory,
  },
];

const validExpressionRule = [
  {
    ruleType: exports.expectedRuleType,
    parameter: exports.expectedParameter,
    categoryId: exports.expectedExpressionCategory,
    name: exports.expectedRuleName,
    priority: exports.expectedPriority,
  },
];

const invalidExpressionRule = [
  {
    ruleType: "invalid",
    parameter: "keyword",
    categoryId: "02",
    name: "Rule01",
    priority: 1,
  },
];

exports.createKeywordRuleEvent = generateCreateExpressionRuleEvent(
  validKeywordRule
);
exports.createValidExpressionRuleEvent = generateCreateExpressionRuleEvent(
  validExpressionRule
);
exports.createInvalidExpressionRuleEvent = generateCreateExpressionRuleEvent(
  invalidExpressionRule
);

exports.listCategoryRulesEvent = {
  resource: "/account/{accountId}/categoryRule",
  httpMethod: "GET",
  pathParameters: { accountId: exports.accountId },
  body: null,
  requestContext: {
    authorizer: {
      claims: {
        aud: exports.clientId,
      },
    },
  },
};

exports.countQueryResult = {
  Count: 1,
  ScannedCount: 1,
};

exports.categoryRules = {
  Count: 2,
  Items: [
    {
      PK: { S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
      SK: { S: "RULE#KEYWORD#Some_Keyword" },
      accountId: { S: exports.accountId },
      keyword: { S: "Some_Keyword" },
      categoryId: { S: "01" },
      name: { S: "Category Name" },
    },
    {
      PK: { S: "ACCOUNT#4801b837-18c0-4277-98e9-ba57130edeb3" },
      SK: { S: "RULE#EXPRESSION#01" },
      accountId: { S: exports.accountId },
      ruleId: { S: "01" },
      ruleType: { S: "startsWith" },
      parameter: { S: "aword" },
      name: { S: "Rule01" },
      priority: { N: "10" },
      categoryId: { S: "02" },
    },
  ],
  ScannedCount: 2,
};

exports.expectedRules = {
    keywordRules: [
        {
            ruleType: 'keyword',
            accountId: exports.accountId,
            priority: 100,
            categoryId: '01',
            keyword: 'Some_Keyword'
        }
    ],
    expressionRules: [
        {
            ruleType: "startsWith",
            accountId: exports.accountId,
            priority: "10",
            categoryId: "02",
            ruleId: "01",
            name: "Rule01",
            parameter: "aword",
        }
    ],
};


const validExpressionRuleToUpdate = {
    old: {
        "parameter": "oldValue"
    },
    new: {
        "parameter": "newValue"
    }
};

exports.updateExpressionRuleEvent = {
    resource: "/account/{accountId}/categoryRule/{ruleType}/{ruleId}",
    httpMethod: "PUT",
    pathParameters: {
        accountId: exports.accountId,
        ruleType: "expression",
        ruleId: "05"
    },
    body: JSON.stringify(validExpressionRuleToUpdate),
    requestContext: {
        authorizer: {
        claims: {
            aud: exports.clientId,
        },
        },
    },
};

exports.updateExpressionRuleParams = {
    Key: {
        PK: {
            S: `ACCOUNT#${exports.accountId}`
        },
        SK: {
            S: "RULE#EXPRESSION#05"
        }
    },
    ExpressionAttributeNames: {
        "#value": "value",
    },
    ExpressionAttributeValues: {
        ":value": {
            S: "oldValue"
        },
        ":old_value": {
            S: "newValue"
        },
    },
    UpdateExpression: " SET #value = :value",
    ConditionExpression: "#value = :old_value",
}

exports.expressionRuleUpdateResult = {
    "Attributes": exports.categoryRules.Items[1]
};

exports.deleteExpressionRuleEvent = {
  resource: "/account/{accountId}/categoryRule/{ruleType}/{ruleId}",
  httpMethod: "DELETE",
  pathParameters: {
      accountId: exports.accountId,
      ruleType: "expression",
      ruleId: "05"
  },
  requestContext: {
      authorizer: {
      claims: {
          aud: exports.clientId,
      },
      },
  },
}

exports.deleteExpressionRuleParams = {
  Key: {
      PK: {
          S: `ACCOUNT#${exports.accountId}`
      },
      SK: {
          S: "RULE#EXPRESSION#05"
      }
  },
  TableName: "virtwallet"
}

exports.deleteRuleResult = {
  "Count": 1,
  "ScannedCount": 1
}

exports.deleteKeywordRuleEvent = {
  resource: "/account/{accountId}/categoryRule/{ruleType}/{ruleId}",
  httpMethod: "DELETE",
  pathParameters: {
      accountId: exports.accountId,
      ruleType: "keyword",
      ruleId: "My%20Keyword"
  },
  requestContext: {
      authorizer: {
      claims: {
          aud: exports.clientId,
      },
      },
  },
}

exports.deleteKeywordRuleParams = {
  Key: {
      PK: {
          S: `ACCOUNT#${exports.accountId}`
      },
      SK: {
          S: "RULE#KEYWORD#My Keyword"
      }
  },
  TableName: "virtwallet"
}