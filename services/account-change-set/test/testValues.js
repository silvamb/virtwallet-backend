
exports.ACCOUNT_ID = "4801b837-18c0-4277-98e9-ba57130edeb3";

exports.expectedChangeSet = [{
    type: "CategoryRule",
    PK: `ACCOUNT#${this.ACCOUNT_ID}`,
    SK: "RULE#EXPRESSION#05",
    op: "Update"
}];

exports.createChangeSetEvent = exports.updateExpressionRuleEvent = {
    source:"virtwallet",
    'detail-type': "new account version",
    detail: JSON.stringify({
      accountId: this.ACCOUNT_ID,
      version: 10,
      changeSet: this.expectedChangeSet
    })
}

exports.putItemResult = {
    ConsumedCapacity: {
        TableName: 'virtwallet',
        CapacityUnits: 1
    } 
}

exports.DynamoDbMock = class {

    constructor(paramsValidators = [], returnValues = []) {
        this.paramsValidators = paramsValidators.reverse();
        this.returnValues = returnValues.reverse();
    }

    putItem(params) {
        const validator = this.paramsValidators.pop();
        validator(params);

        return {
            promise: () => Promise.resolve(this.returnValues.pop())
        }
    }
}