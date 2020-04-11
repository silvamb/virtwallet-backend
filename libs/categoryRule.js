const dynamodb = require("./dynamodb");
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;
const fromItem = dynamodb.fromItem;

const KEYWORD_RULE_TYPE = "keyword"
const STARTS_WITH_RULE_TYPE = "startsWith";
const CONTAINS_RULE_TYPE = "contains";
const REGEX_RULE_TYPE = "regex";

const VALID_TYPES = [STARTS_WITH_RULE_TYPE, CONTAINS_RULE_TYPE, REGEX_RULE_TYPE]

const exprRuleAttrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["ruleId", dynamodb.StringAttributeType],
    ["ruleType", dynamodb.StringAttributeType],
    ["parameter", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["priority", dynamodb.IntegerAttributeType],
    ["categoryId", dynamodb.StringAttributeType]
]);

const getPK = (accountId) => `ACCOUNT#${accountId}`;
const getSK = () => {
    return "RULE#";
};

const getExpressionRuleSK = (ruleId = "") => {
    return `RULE#EXPRESSION#${ruleId}`;
};

const getKeywordRuleSK = (keyword = "") => {
    return `RULE#KEYWORD#${keyword}`;
};

const isTypeValid = (type) => {
    return VALID_TYPES.indexOf(type) >= 0;
};

const startsWithRule = (target, text) => target.startsWith(text);
const containsRule = (target, text) => target.indexOf(text) >= 0;
const regexRule = (target, regex) => new RegExp(regex).test(target);

const ruleMap = new Map([
    [STARTS_WITH_RULE_TYPE, startsWithRule],
    [CONTAINS_RULE_TYPE, containsRule],
    [REGEX_RULE_TYPE, regexRule],
]);

/**
 * Check if a category rule is a Keyword rule
 * 
 * @param {*} ruleDetails the category rule details
 */
const KEYWORD_FILTER = ruleDetails => ruleDetails.ruleType === KEYWORD_RULE_TYPE;

/**
 * Check if a category rule is an Expression rule
 * 
 * @param {*} ruleDetails the category rule details
 */
const EXPRESSION_RULE_FILTER = ruleDetails => ruleDetails.ruleType !== KEYWORD_RULE_TYPE;

class CategoryRule {

    constructor(ruleType) {
        this.ruleType = ruleType;
        this.accountId = "";
        this.priority = 0;
        this.categoryId = "";
    }

}

class ExpressionCategoryRule extends CategoryRule {

    constructor(ruleType = CONTAINS_RULE_TYPE) {
        super(ruleType);
        this.ruleId = "";
        this.name = "";
        this.parameter = "";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getExpressionRuleSK(this.ruleId);
    }

    getAttrTypeMap() {
        return exprRuleAttrTypeMap;
    }

    /**
     * @param {string} ruleType
     */
    set ruleType(ruleType) {
        if(!isTypeValid(ruleType)) {
            throw new Error(`Invalid rule type: [${ruleType}]`);
        }
        super.ruleType = ruleType;
    }

    test(text) {
        const ruleFunction = ruleMap.get(this.ruleType);

        return ruleFunction(text, parameter);
    }
}

class KeywordCategoryRule extends CategoryRule {
    constructor(keyword = "") {
        super(KEYWORD_RULE_TYPE);
        super.priority = 100;
        this.keyword = keyword;
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getKeywordRuleSK(this.keyword);
    }

    getAttrTypeMap() {
        return new Map([
            ["accountId", dynamodb.StringAttributeType],
            ["keyword", dynamodb.StringAttributeType],
            ["categoryId", dynamodb.StringAttributeType]
        ]);
    }
}

exports.create = async (dynamodb, accountId, categoryRulesToAdd) => {
    console.log(`Creating new category rules for account ${accountId}.`);
    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);

    let retVal;

    const hasExpressionRules = categoryRulesToAdd.find(EXPRESSION_RULE_FILTER);

    let nextRuleId = -1;

    const keywordRules = categoryRulesToAdd.filter(KEYWORD_FILTER).map(ruleDetails => createKeywords(ruleDetails, accountId));
    let expressionRules = [];

    if (hasExpressionRules) {
        const skPrefix = getExpressionRuleSK();

        nextRuleId = await dbClient.getNext(pk, skPrefix);
        console.log(`Category Rules starting at ${nextRuleId}.`);

        console.log(`Creating new expression rules for account ${accountId}.`);
        expressionRules = categoryRulesToAdd.filter(EXPRESSION_RULE_FILTER)
            .map((ruleDetails, index) => createExpressionRules(ruleDetails, accountId, nextRuleId + index));
    }

    const categoryRules = keywordRules.concat(expressionRules)

    if (categoryRules.length == 1) {
        console.log(`Persisting new category rule in DynamoDb: [${JSON.stringify(categoryRules[0])}]`);
        const item = await dbClient.putItem(categoryRules[0]);

        console.log("Put item returned", item);

        retVal = item;
    } else {
        console.log(`Persisting ${categoryRules.length} new category rules in DynamoDb`);
        retVal = await dbClient.putItems(categoryRules);
    }

    return retVal;
}

function createKeywords(keywordDetails, accountId) {

    const keyword = new KeywordCategoryRule();
    keyword.accountId = accountId;
    keyword.keyword = keywordDetails.keyword;
    keyword.categoryId = keywordDetails.categoryId;

    return keyword;
}

function createExpressionRules(expressionDetails, accountId, ruleId) {
    const rule = new ExpressionCategoryRule(expressionDetails.ruleType);
    rule.accountId = accountId;
    rule.ruleId = String(ruleId).padStart(2, '0');
    rule.name = expressionDetails.name;
    rule.parameter = expressionDetails.parameter;
    rule.categoryId = expressionDetails.categoryId;
    rule.priority = expressionDetails.priority || 0;

    return rule;
}

exports.list = async (dynamodb, accountId, ruleType = "NO_TYPE") => {
    // TODO validate if user is a member of this account
    console.log(`Listing category rules for account [${accountId}]`);

    const dbClient = new DynamoDb(dynamodb);

    const pk = getPK(accountId);
    let sk;

    if("NO_TYPE" === ruleType) {
        sk = getSK();
    } else {
        sk = KEYWORD_RULE_TYPE == ruleType ? getKeywordSK() : getExpressionRuleSK();
    }

    const queryBuilder = new QueryBuilder(pk).withSkStartingWith(sk);

    const queryData = await dbClient.query(queryBuilder.build());

    const categoryRules = queryData.Items.map(item => {
        console.log(`Creating category rules from item ${item.SK.S}`);
    
        let categoryRule;
        const keywordSk = getKeywordRuleSK();
    
        if(item.SK.S.startsWith(keywordSk)) {
            categoryRule = fromItem(item, new KeywordCategoryRule());
        } else {
            categoryRule = fromItem(item, new ExpressionCategoryRule());
        }
    
        return categoryRule;
    });

    console.log(`Category rules retrieved for account [${accountId}]: ${categoryRules.length}`, categoryRules);

    return categoryRules;
}

exports.KeywordCategoryRule = KeywordCategoryRule;
exports.ExpressionCategoryRule = ExpressionCategoryRule;