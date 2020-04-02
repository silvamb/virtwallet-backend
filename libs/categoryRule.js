const dynamodb = require("./dynamodb");

const KEYWORD_RULE_TYPE = "keyword"
const STARTS_WITH_RULE_TYPE = "startsWith";
const CONTAINS_RULE_TYPE = "contains";
const REGEX_RULE_TYPE = "regex";

const VALID_TYPES = [STARTS_WITH_RULE_TYPE, CONTAINS_RULE_TYPE, REGEX_RULE_TYPE]

const exprRuleAttrTypeMap = new Map([
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


class CategoryRule {

    constructor() {
        this.priority = 0;
        this.categoryId = "";
    }

}

class ExpressionCategoryRule extends CategoryRule {

    constructor() {
        super();
        super.ruleType = CONTAINS_RULE_TYPE;
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
    }

    test(text) {
        const ruleFunction = ruleMap.get(this.ruleType);

        return ruleFunction(text, parameter);
    }
}

class KeywordCategoryRule extends CategoryRule {
    constructor() {
        super();
        super.ruleType = KEYWORD_RULE_TYPE;
        super.priority = 100;
        this.keyword = "";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getKeywordRuleSK(this.keyword);
    }

    getAttrTypeMap() {
        return new Map([
            ["keyword", dynamodb.StringAttributeType],
            ["categoryId", dynamodb.StringAttributeType]
        ]);
    }
}

exports.KeywordCategoryRule = KeywordCategoryRule;
exports.ExpressionCategoryRule = ExpressionCategoryRule;
exports.getPK = getPK;
exports.getSK = getSK;
exports.getExpressionRuleSK = getExpressionRuleSK;
exports.getKeywordRuleSK = getKeywordRuleSK;
exports.isTypeValid = isTypeValid;
exports.KEYWORD_RULE_TYPE = KEYWORD_RULE_TYPE;