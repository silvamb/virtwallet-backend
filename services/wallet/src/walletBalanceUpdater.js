
const { updateBalance, Wallet } = require('libs/wallet');
const { createVersionForUpdatedItems, publishChangeSet } = require('libs/version');

exports.updateBalance = async (dynamodb, eventbridge, event) => {
    const eventType = event['detail-type'];

    if(!operationMap.has(eventType)) {
        throw new Error(`Unsupported event type: [${eventType}`);
    }

    const handler = operationMap.get(eventType);
    return await handler(dynamodb, eventbridge, event.detail);
}

const operationMap = new Map([
    ["transactions created", processTransactionsCreated],
    ["transaction updated", processTransactionUpdated],
    ["transactions updated", processTransactionsUpdated]
]);

async function processTransactionsCreated(dynamodb, eventbridge, details) {
    console.log("Processing 'transaction created' event for updating balance");
    const transactions = details.transactions;
    const accountId = transactions[0].accountId;
    const walletId = transactions[0].walletId;

    console.log("Calculating balance from transactions, accountId:", accountId, ", walletId:", walletId);
    const balance = transactions.reduce((total, transaction) => total += Number(transaction.value), 0);

    return updateWallet(dynamodb, eventbridge, accountId, walletId, balance);
}

async function processTransactionUpdated(dynamodb, eventbridge, details) {
    console.log("Processing 'transaction updated' event for updating balance");
    const {accountId, walletId, old, new: updated} = details;
    
    if(!old.value || !updated.value || old.value === updated.value) {
        console.log("Wallet balance hasn't change, nothing to do");
        return {
            data: null
        }
    }

    console.log("Calculating balance from transactions, accountId:", accountId, ", walletId:", walletId);
    const balance = updated.value - old.value;

    return updateWallet(dynamodb, eventbridge, accountId, walletId, balance);
}

async function processTransactionsUpdated(dynamodb, eventbridge, details) {
    console.log("Processing 'transaction created' event for updating balance");
    const changes = details.changes;
    const accountId = details.accountId;
    const walletId = details.walletId;
    
    
    const valueFilter = (change) => change.old.value && change.new.value;
    const reducer = (total, change) => total += (change.new.value - change.old.value);

    const filtered = changes.filter(valueFilter);

    if(filtered.length > 0) {
        const balance = filtered.reduce(reducer, 0);
        console.log("Calculating balance from updated transactions, accountId:", accountId, ", walletId:", walletId);
        return updateWallet(dynamodb, eventbridge, accountId, walletId, balance);
    } else {
        console.log("Wallet balance hasn't change");
        return {
            data: null
        };
    }
   
}

async function updateWallet(dynamodb, eventbridge, accountId, walletId, balance) {
    console.log("Sum to be added to the current balance:", balance);
    const wallet = new Wallet(accountId, walletId);

    const updateResult = await updateBalance(dynamodb, wallet, balance);

    console.log("Creating account version for updated wallet", updateResult);
    const versionedChangeSet = await createVersionForUpdatedItems({dynamodb, accountId, results: [updateResult]});

    if(versionedChangeSet) {
        await publishChangeSet(eventbridge, versionedChangeSet);
    }

    return updateResult;
}