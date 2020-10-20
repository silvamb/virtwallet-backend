const { saveChangeSet, ChangeSet } = require('libs/version');
exports.saveChangeSet = async (dynamodb, event) => {

    const {accountId, version, changeSet} = JSON.parse(event.detail);

    saveChangeSet(dynamodb, new ChangeSet(accountId, version, changeSet));
}