const dynamodb = require("./dynamodb");

const attrTypeMap = new Map([
    ["accountId", dynamodb.StringAttributeType],
    ["categoryId", dynamodb.StringAttributeType],
    ["name", dynamodb.StringAttributeType],
    ["description", dynamodb.StringAttributeType]
]);

const getPK = (accountId) => `ACCOUNT#${accountId}`;
const getSK = (categoryId) => {
    let sk = `CATEGORY#`;
    
    if(categoryId) {
        sk = sk.concat(categoryId);
    }

    return sk;
}

class Category {

    constructor() {
        this.accountId = "";
        this.categoryId = "";
        this.name = "";
        this.description = "";
    }

    getHash() {
        return getPK(this.accountId);
    }

    getRange() {
        return getSK(this.categoryId);
    }

    getAttrTypeMap() {
        return attrTypeMap;
    }
}

exports.Category = Category;
exports.getPK = getPK;
exports.getSK = getSK;
