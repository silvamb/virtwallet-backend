
const { AccountMetadata } = require('./account');
const { DynamoDb, NumberAttributeType, JSONAttributeType, UpdateExpressionBuilder, fromItem } = require('./dynamodb');

/** Number of maximum retries to get a new Account version */
const MAX_RETRIES = 3;

/** Change set attributes map */
const attrTypeMap = new Map([
    ["version", NumberAttributeType],
    ["changeSet", JSONAttributeType],
]);

/**
 * An Item Change.
 */
class ItemChange {

    /**
     * 
     * @param {string} entityType The entity type of the item, i.e. Category, Wallet, Transaction, etc...
     * @param {*} obj a versioned entity
     * @param {string} operation the operation, Add, Update or Delete
     */
    constructor(obj = {}, operation = "") {
        /** The entity type of the item, i.e. Category, Wallet, Transaction, etc... */
        this.type = obj.getType();
        
        /** The entity PK */
        this.PK = obj.getHash();
        
        /** The entity SK */
        this.SK = obj.getRange();

        /** The operation. Add, Update or Delete */
        this.op = operation;
    }
}

/**
 * Represents a new item that has been added
 */
class NewItem extends ItemChange {
    constructor(obj) {
        super(obj, "Add");
    }
}

/**
 * Represents an updated item
 */
class UpdatedItem extends ItemChange {
    constructor(obj) {
        super(obj, "Update");
    }
}

/**
 * Represents a deleted item
 */
class DeletedItem extends ItemChange {
    constructor(obj) {
        super(obj, "Delete");
    }
}

/**
 * Account change set. Each change set represents the changes in a version.
 * Each set contains the items modified in the version.
 */
class ChangeSet {

    /**
     * 
     * @param {string} accountId the account ID 
     * @param {number} version the version number
     * @param {Array<ChangeSet>} changeSet an array with all the changes
     */
    constructor(accountId = "", version = 0, changeSet = []) {
        this.accountId = accountId;
        this.version = version;
        this.changeSet = changeSet;
    }

    /**
     * Returns this item PK.
     */
    getHash() {
        return `ACCOUNT#${this.accountId}`;
    }

    /**
     * Returns this item SK.
     */
    getRange() {
        return `VERSION#${this.version}`;
    }

    /**
     * Returns a map with all attributes and their types.
     */
    getAttrTypeMap() {
        return attrTypeMap;
    }
}

/**
 * 
 * @param {DynamoDb} dbClient Virtwallet DynamoDb library
 * @param {*} versionUpdate parameters for updating the account version
 */
async function updateVersion(dbClient, versionUpdate) {
    try {
        const results = await dbClient.updateItems([versionUpdate]);
        return results[0];
    } catch(err) {
        console.log("Error update item", err)
        return {
            success: false
        }
    }
}

/**
 * Generate item changes.
 * 
 * @param {Function} supplier function to create the item change
 * @param {Array<Result>} results the operation results. Only filter the successful operations 
 */
function generateChangesFromResult(supplier, results) {
    return results.filter(result => result.err === undefined).map(result => supplier(result.data));

}

async function createChangeSet({dynamodb, accountId, itemChangeSupplier, results}) {
    const changes = generateChangesFromResult(itemChangeSupplier, results);

    let changeSet = null;
    if (changes.length > 0){
        changeSet = await getVersion(dynamodb, accountId, changes)
        console.log("Change set created", changeSet);
    }

    return changeSet;
}

/**
 * Returns a new version from the Account.
 * 
 * @param {AWS.DynamoDb} dynamodb DynamoDb AWS JS SDK client
 * @param {*} accountId the account ID
 * @param {*} results the items changed, to create a new change set.
 */
async function getVersion(dynamodb, accountId, changedItems) {
    console.log("Creating new version for account", accountId);
    const metadata = new AccountMetadata(accountId);
    const dbClient = new DynamoDb(dynamodb);

    const versionUpdate = new UpdateExpressionBuilder(metadata).addTo("version", 1).build();

    let tries = 0;
    let result;

    do {
        result = await updateVersion(dbClient, versionUpdate);
        console.log("Update version succeeded:", result.success, "tries", tries);
    } while(!result.success && ++tries <= MAX_RETRIES);

    if(!result.success) {
        throw new Error("Failed to update version");
    }

    const updatedVersion = result.success ? fromItem(result.data.Attributes, new AccountMetadata(accountId)) : -1;
    console.log("New version for account ", accountId, ":", updatedVersion.version);

    return new ChangeSet(accountId, updatedVersion.version, changedItems);
}


/**
 * Generates a versioned Result for created items.
 */
exports.createVersionForCreatedItems = async ({
    dynamodb,
    accountId,
    results
}) => {
    const itemChangeSupplier = (obj) => new NewItem(obj);
    
    console.log("Generating versioned results");
    return createChangeSet({dynamodb, accountId, itemChangeSupplier, results});
}

/**
 * Generates a versioned Result for updated items.
 */
exports.createVersionForUpdatedItems = async ({
    dynamodb,
    accountId,
    results
}) => {
    const itemChangeSupplier = (obj) => new UpdatedItem(obj);
    return createChangeSet({dynamodb, accountId, itemChangeSupplier, results});
}

/**
 * Generates a versioned Result for deleted items.
 */
exports.createVersionForDeletedItems = async ({
    dynamodb,
    accountId,
    results
}) => {
    const itemChangeSupplier = (obj) => new DeletedItem(obj);
    return createChangeSet({dynamodb, accountId, itemChangeSupplier, results});
}

/**
 * Publishes an event to create the change set item in the database.
 * 
 * @param {AWS.EventBridge} eventbridge EventBridge AWS JS SDK client
 * @param {ChangeSet} changeSet the change set to publish
 */
exports.publishChangeSet = async (eventbridge, changeSet) => {
    const params = {
        Entries: [
            {
                Source: "virtwallet",
                DetailType: "new account version",
                Time: new Date(),
                Detail: JSON.stringify(changeSet),
            },
        ],
    };

    console.log("Publishing [new account version] event", params);

    try {
        const putEventResult = await eventbridge.putEvents(params).promise();
        console.log("Publishing [new account version] event result", putEventResult);

        if(putEventResult.FailedEntryCount > 0) {
            console.log("FATAL - Failed to publish version event", params);
        }
    } catch(err) {
        console.log("FATAL - Error publishing version event", params, err);
    }
}

/**
 * Saves a change set in the database.
 * 
 * @param {AWS.DynamoDB} dynamodb DynamoDb AWS JS SDK client
 * @param {ChangeSet} changeSet the change set to save
 */
exports.saveChangeSet = async (dynamodb, changeSet) => {
    const dbClient = new DynamoDb(dynamodb);

    console.log("Saving change set to database", changeSet)
    const result = await dbClient.putItem(changeSet, false);

    if(!result.success) {
        throw new Error("Fail to save change set in DynamoDB");
    }
}

exports.NewItem = NewItem;
exports.UpdatedItem = UpdatedItem;
exports.DeletedItem = DeletedItem;
exports.ChangeSet = ChangeSet;