exports.clientId = "ef471999-eb8f-5bc5-b39d-037e99f341c4";
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
          sub: exports.clientId,
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
        sub: exports.clientId,
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
      versionId: 1
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
      versionId: 1
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
            keyword: 'Some_Keyword',
            versionId: 1,
        }
    ],
    expressionRules: [
        {
            ruleType: "startsWith",
            accountId: exports.accountId,
            priority: 10,
            categoryId: "02",
            ruleId: "01",
            name: "Rule01",
            parameter: "aword",
            versionId: 1,
        }
    ],
};

exports.putItemResult = {
  ConsumedCapacity: {
      TableName: 'virtwallet-dev',
      CapacityUnits: 1
  } 
}

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
            sub: exports.clientId,
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
        "#value": "parameter",
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

const validKeywordRuleToUpdate = {
  old: {
      "categoryId": "01"
  },
  new: {
      "categoryId": "03"
  }
};

exports.updateKeywordRuleEvent = {
  resource: "/account/{accountId}/categoryRule/{ruleType}/{ruleId}",
  httpMethod: "PUT",
  pathParameters: {
      accountId: exports.accountId,
      ruleType: "keyword",
      ruleId: "MyKeyword"
  },
  body: JSON.stringify(validKeywordRuleToUpdate),
  requestContext: {
      authorizer: {
      claims: {
          sub: exports.clientId,
      },
      },
  },
};

exports.updateKeywordRuleParams = {
  Key: {
      PK: {
          S: `ACCOUNT#${exports.accountId}`
      },
      SK: {
          S: "RULE#KEYWORD#MyKeyword"
      }
  },
  ExpressionAttributeNames: {
      "#value": "categoryId",
  },
  ExpressionAttributeValues: {
      ":value": {
          S: "01"
      },
      ":old_value": {
          S: "03"
      },
  },
  UpdateExpression: " SET #value = :value",
  ConditionExpression: "#value = :old_value",
}

exports.keywordRuleUpdateResult = {
  "Attributes": exports.categoryRules.Items[0]
};

const invalidKeywordRuleToUpdate = {
  old: {
      "keyword": "MyKeyword",
      "categoryId": "01"
  },
  new: {
      "keyword": "AnotherKeyword",
      "categoryId": "03"
  }
};

exports.invalidUpdateKeywordRuleEvent = {
  resource: "/account/{accountId}/categoryRule/{ruleType}/{ruleId}",
  httpMethod: "PUT",
  pathParameters: {
      accountId: exports.accountId,
      ruleType: "keyword",
      ruleId: "MyKeyword"
  },
  body: JSON.stringify(invalidKeywordRuleToUpdate),
  requestContext: {
      authorizer: {
      claims: {
          sub: exports.clientId,
      },
      },
  },
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
          sub: exports.clientId,
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
  TableName: "virtwallet-dev"
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
          sub: exports.clientId,
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
  TableName: "virtwallet-dev"
}

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

exports.expectedNewKeywordVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#KEYWORD#${this.expectedKeyword}`,
          op: "Add"
      }]
  })
}

exports.expectedNewExprRuleVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#EXPRESSION#02`,
          op: "Add"
      }]
  })
}

exports.expectedUpdateKeywordVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#KEYWORD#MyKeyword`,
          op: "Update"
      }]
  })
}

exports.expectedUpdateExprRuleVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#EXPRESSION#05`,
          op: "Update"
      }]
  })
}

exports.expectedDeleteKeywordVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#KEYWORD#My Keyword`,
          op: "Delete"
      }]
  })
}

exports.expectedDeleteExprRuleVersionEvent = {
  Source:"virtwallet",
  DetailType: "new account version",
  Detail: JSON.stringify({
      accountId: this.accountId,
      version: 7,
      changeSet: [{
          type: "CategoryRule",
          PK: `ACCOUNT#${this.accountId}`,
          SK: `RULE#EXPRESSION#05`,
          op: "Delete"
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