const { saveChangeSet, ChangeSet } = require('libs/version');
exports.saveChangeSet = async (dynamodb, event) => {

    const {accountId, version, changeSet} = event.detail;

    return saveChangeSet(dynamodb, new ChangeSet(accountId, version, changeSet));
}