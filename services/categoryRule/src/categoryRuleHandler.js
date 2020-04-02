const categoryRule = require('libs/categoryRule');
const ExpressionCategoryRule = categoryRule.ExpressionCategoryRule;
const KeywordCategoryRule = categoryRule.KeywordCategoryRule;

const dynamodb = require('libs/dynamodb');
const DynamoDb = dynamodb.DynamoDb;
const QueryBuilder = dynamodb.QueryBuilder;

const fromItem = dynamodb.fromItem;
const getPK = categoryRule.getPK;
const getSK = categoryRule.getSK;
const getExpressionRuleSK = categoryRule.getExpressionRuleSK;
const getKeywordRuleSK = categoryRule.getKeywordRuleSK;

const KEYWORD_RULE_TYPE = categoryRule.KEYWORD_RULE_TYPE;


/**
 * Check if a category rule is a Keyword rule
 * 
 * @param {*} ruleDetails the category rule details
 */
const KEYWORD_FILTER = ruleDetails => ruleDetails.ruleType === categoryRule.KEYWORD_RULE_TYPE;

/**
 * Check if a category rule is an Expression rule
 * 
 * @param {*} ruleDetails the category rule details
 */
const EXPRESSION_RULE_FILTER = ruleDetails => ruleDetails.ruleType !== categoryRule.KEYWORD_RULE_TYPE;

class CategoryRuleHandler {

    constructor(dynamodb) {
        console.log("Creating Category Rule Handler");
        this.dbClient = new DynamoDb(dynamodb);
    }

    async create(clientId, accountId, categoryRulesToAdd) {
        // TODO validate if user is a member of this account

        const pk = getPK(accountId);
        console.log(`Creating new category rules for user ${clientId} and account ${accountId}.`);

        let retVal;

        const hasExpressionRules = categoryRulesToAdd.find(EXPRESSION_RULE_FILTER);

        let nextRuleId = -1;

        const keywordRules = categoryRulesToAdd.filter(KEYWORD_FILTER).map(ruleDetails => createKeywords(ruleDetails, accountId));
        let expressionRules = [];

        if (hasExpressionRules) {
            const skPrefix = getExpressionRuleSK();

            nextRuleId = await this.dbClient.getNext(pk, skPrefix);
            console.log(`Category Rules starting at ${nextRuleId}.`);

            console.log(`Creating new expression rules for account ${accountId}.`);
            expressionRules = categoryRulesToAdd.filter((ruleDetails) => ruleDetails.ruleType !== categoryRule.KEYWORD_RULE_TYPE)
                .map((ruleDetails, index) => createExpressionRules(ruleDetails, accountId, nextRuleId + index));
        }

        const categoryRules = keywordRules.concat(expressionRules)

        if (categoryRules.length == 1) {
            console.log(`Persisting new category rule in DynamoDb: [${JSON.stringify(categoryRules[0])}]`);
            const item = await this.dbClient.putItem(categoryRules[0]);

            console.log("Put item returned", item);

            retVal = item;
        } else {
            console.log(`Persisting ${categoryRules.length} new category rules in DynamoDb`);
            retVal = await this.dbClient.putItems(categoryRules);
        }

        return retVal;
    }

    async list(_clientId, accountId, ruleType = "NO_TYPE") {
        // TODO validate if user is a member of this account
        console.log(`Listing category rules for account [${accountId}]`);

        const pk = getPK(accountId);
        let sk;

        if("NO_TYPE" === ruleType) {
            sk = getSK();
        } else {
            sk = categoryRule.KEYWORD_RULE_TYPE == ruleType ? getKeywordSK() : getExpressionRuleSK();
        }

        const queryBuilder = new QueryBuilder(pk).withSkStartingWith(sk);

        const queryData = await this.dbClient.query(queryBuilder.build());

        const categoryRules = queryData.Items.map(createCategoryRule);

        console.log(`Category rules retrieved for account [${accountId}]: ${categoryRules.length}`, categoryRules);

        return categoryRules;
    }

    async get(accountId, ruleId, ruleType) {
        // TODO validate if user is a member of this account

        const pk = getPK(accountId);
        const sk = ruleType == categoryRule.KEYWORD_RULE_TYPE ? getKeywordRuleSK(ruleId) : getExpressionRuleSK(ruleId);
        
        const queryData = await this.dbClient.queryAll(pk, sk);
        const category = createCategoryRule(queryData.Items[0]);

        return category;
    }

    async update(_clientId, _category) {
        throw new Error("Operation CategoryRuleHandler.update not implemented yet");
    }

    async delete(_clientId, _accountId, _categoryId) {
        throw new Error("Operation CategoryRuleHandler.delete not implemented yet");
    }
}

function createKeywords(keywordDetails, accountId) {

    const keyword = new KeywordCategoryRule();
    keyword.accountId = accountId;
    keyword.keyword = keywordDetails.keyword;
    keyword.categoryId = keywordDetails.categoryId;

    return keyword;
}

function createExpressionRules(expressionDetails, accountId, ruleId) {
    const rule = new ExpressionCategoryRule();
    rule.accountId = accountId;
    rule.ruleId = String(ruleId).padStart(2, '0');
    rule.name = expressionDetails.name;
    rule.ruleType = expressionDetails.ruleType;
    rule.parameter = expressionDetails.parameter;
    rule.categoryId = expressionDetails.categoryId;
    rule.priority = expressionDetails.priority || 0;

    return rule;
}

function createCategoryRule(item) {
    console.log(`Creating category from item ${item.SK.S}`);

    let categoryRule;
    const keywordSk = getKeywordRuleSK();

    if(item.SK.S.startsWith(keywordSk)) {
        categoryRule = fromItem(item, new KeywordCategoryRule());
    } else {
        categoryRule = fromItem(item, new ExpressionCategoryRule());
    }

    return categoryRule;
}

exports.CategoryRuleHandler = CategoryRuleHandler;