const csv = require('csv-parser');
const moment = require('moment');

const stream = require('stream');
const util = require('util');
const finished = util.promisify(stream.finished);

const transaction = require('libs/transaction');
const Transaction = transaction.Transaction;
const DEBIT_BALANCE_TYPE = transaction.DEBIT_BALANCE_TYPE;
const CREDIT_BALANCE_TYPE = transaction.CREDIT_BALANCE_TYPE;

const POS_TX_REGEX = /^(\d{4}) (\d\d[A-Z]{3}\d\d) /;
const CL_REGEX = /(.*) (\d\d[A-Z]{3})$/;

class UlsterCsvParser {
    constructor(s3) {
        this.s3 = s3;
    }

    async parseCsvFile(s3Bucket, s3Key) {
        const s3Params = {
            Bucket: s3Bucket,
            Key: s3Key
        };

        const s3Stream = this.s3.getObject(s3Params).createReadStream();

        console.log(`Parsing transactions from file [${s3Key}]`);
        const transactions = await readTransactions(s3Stream);

        console.log(`Total transactions parsed [${transactions.length}]`);

        return transactions;
    }
}

async function readTransactions(fileStream) {

    const results = [];
    const dayCounter = new Map();
    fileStream.pipe(csv({headers: false, skipLines: 3}))
        .on('data', (data) => results.push(parseLine(data, dayCounter)))
        .on('end', () => {
            console.log("Finished reading CSV");
        });

    await finished(fileStream);

    console.log(results);
    return results;
}

function parseLine(fields, dayCounter) {
    const transaction = new Transaction();

    const txRawPostDate = moment.utc(fields[0], 'DD/MM/YYYY', true);

    transaction.txDate = txRawPostDate.format('YYYY-MM-DD');
    transaction.txId = getTxId(txRawPostDate, dayCounter);
    transaction.dt = txRawPostDate.format();
    setValue(transaction, fields[3]);
    transaction.description = removeTrailingQuote(fields[2]);
    transaction.type = fields[1];
    transaction.balance = fields[4];
    transaction.category =  "NO_CATEGORY";
    
    delete transaction.accountId;
    delete transaction.walletId;
    delete transaction.includedBy;
    delete transaction.source;
    delete transaction.sourceType;

    if(transaction.type == 'POS') {
        transformPosTx(transaction);
    }

    if(transaction.type == 'C/L') {
        transformCLTx(transaction);
    }

    return transaction;
}

function getTxId(txRawDate, dayCounter) {
    const txDateKey = txRawDate.format('YYYYMMDD');

    const i = dayCounter.get(txDateKey) || 0;
    dayCounter.set(txDateKey, i + 1);

    const txIndex = String(i + 1).padStart(4, '0');

    return txDateKey.concat(txIndex);
}

function removeTrailingQuote(str) {
    return str.charAt(0) === "'" ? str.substring(1) : str;
}

function setValue(transaction, value) {
    if(value.charAt(0) === "-") {
        transaction.value = value.substring(1);
        transaction.balanceType = DEBIT_BALANCE_TYPE;
    } else {
        transaction.value = value;
        transaction.balanceType = CREDIT_BALANCE_TYPE;
    }
}

function transformPosTx(transaction) {
    if(!POS_TX_REGEX.test(transaction.description)) {
        console.log(`POS transaction does not match expected pattern`);
        return;
    }

    // TODO add card to the transaction metadata
    const card = transaction.description.substring(0,4);
    console.log(`Card used in POS: [${card}]`);

    const originalTxDateStr = transaction.description.substring(5,12);
    const originalTxDate = moment(originalTxDateStr, 'DDMMMYY', 'en-GB', true);
    transaction.txDate = originalTxDate.format('YYYY-MM-DD');
    console.log(`Original date from txId:[${transaction.txDate}] :[${transaction.txId}]`);

    const txDescStart = transaction.description.indexOf(',');
    transaction.description = transaction.description.substring(txDescStart + 1);
}

function transformCLTx(transaction) {

    if(POS_TX_REGEX.test(transaction.description)) {
        transformPosTx(transaction);
        return;
    }

    if(!CL_REGEX.test(transaction.description)) {
        console.log(`CL transaction does not match expected pattern`);
        return;
    }

    const matches = transaction.description.match(CL_REGEX);

    // Get the year from the current tx date
    const year = transaction.txDate.substring(0,4);

    // The second matched group should be a date in format DDMM.
    const originalTxDateStr = matches[2].concat(year);
    console.log(`CL original tx date: [${originalTxDateStr}]`);

    const originalTxDate = moment(originalTxDateStr, 'DDMMMYYYY', 'en-GB', true);
    
    /*
     * The original date must be before the post date. If after extracting from
     * the description and parsed the transaction date is still after the post date
     * subtract 1 year. This case should only happens in dates closes to the end of
     * the year.  
     */
    if(originalTxDate.isAfter(moment.utc(transaction.txDate))) {
        console.log(`Original date [${originalTxDate.format('YYYY-MM-DD')}] cannot be greater then the post date [${transaction.txDate}]`);

        originalTxDate.subtract(1, 'years');
    }

    // Update the tx date with the real one
    transaction.txDate = originalTxDate.format('YYYY-MM-DD');

    // Strip the date from the description and leave only the text.
    transaction.description = matches[1].trim();
}

exports.UlsterCsvParser = UlsterCsvParser;