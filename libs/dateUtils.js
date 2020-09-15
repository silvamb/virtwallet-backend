const moment = require('moment');

const TX_DATE_FORMAT = 'YYYY-MM-DD';
const YEAR_MONTH_FORMAT = 'YYYY-MM';

exports.TX_DATE_FORMAT = TX_DATE_FORMAT;
exports.YEAR_MONTH_FORMAT = YEAR_MONTH_FORMAT;

function fixStartDate(startDate) {
    if(startDate.day() === 0) {
        startDate.subtract('days', 2);
    } else if (startDate.day() === 6) {
        startDate.subtract('days', 1);
    }
}

exports.MonthStartDateRule = class  {

    constructor({dayOfMonth = 25, currentMonth = false, manuallySetPeriods = []} = {} = {}) {
        this.dayOfMonth = dayOfMonth;
        this.currentMonth = currentMonth;
        this.manuallySetPeriods = manuallySetPeriods;
    }

    getMonth(txDateStr, dateFormat = TX_DATE_FORMAT) {
        const txDate = moment(txDateStr, dateFormat);

        let month = this.getMonthFromManuallySet(txDate);
        if(!month) {
            month = this.getMonthFromDay(txDate);
        }

        return month;
    }

    getMonthFromManuallySet(date = moment()) {
        const rule = this.manuallySetPeriods.find(manuallySet => date.isBetween(manuallySet.startDate, manuallySet.endDate, undefined, '[]'));
        if(rule) {
            return rule.month;
        }
    }

    getMonthFromDay(date = moment()) {
        const startDate = moment(date).date(this.dayOfMonth);        
        fixStartDate(startDate);

        let monthDate;
        if(this.currentMonth) {
            monthDate = date.isBefore(startDate) ? moment(date).date(1).subtract(1, 'months') : date;
        } else {
            monthDate = date.isBefore(startDate) ? date : moment(date).date(1).add(1, 'months');
        }

        return monthDate.format(YEAR_MONTH_FORMAT);
    }

}