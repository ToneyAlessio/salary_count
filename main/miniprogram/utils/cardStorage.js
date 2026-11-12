/**
 * 工资卡本地存储：salaryCardInfo / salaryCardAmount
 */

const CARD_STORAGE_KEY = 'salaryCardAmount';
const CARD_INFO_KEY = 'salaryCardInfo';

function formatMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        return '0.00';
    }
    return n.toFixed(2);
}

function normalizeYesterday(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }
    if (raw.amount == null || raw.amount === '') {
        return null;
    }
    return {
        amount: formatMoney(Number(raw.amount) || 0),
        date: raw.date ? String(raw.date) : '',
    };
}

function readCardInfo() {
    const info = wx.getStorageSync(CARD_INFO_KEY);
    if (
        info &&
        typeof info === 'object' &&
        !Array.isArray(info) &&
        info.amount != null &&
        info.amount !== ''
    ) {
        return {
            amount: formatMoney(Number(info.amount) || 0),
            updateDate: info.updateDate ? String(info.updateDate) : '',
            todayCredited: formatMoney(Number(info.todayCredited) || 0),
            yesterday: normalizeYesterday(info.yesterday),
        };
    }
    const legacy = wx.getStorageSync(CARD_STORAGE_KEY);
    if (legacy != null && legacy !== '') {
        if (typeof legacy === 'string' || typeof legacy === 'number') {
            return {
                amount: formatMoney(Number(legacy) || 0),
                updateDate: '',
                todayCredited: '0.00',
                yesterday: null,
            };
        }
    }
    return {
        amount: '0.00',
        updateDate: '',
        todayCredited: '0.00',
        yesterday: null,
    };
}

/** @param {{ amount: number|string, updateDate: string, todayCredited?: number|string, yesterday?: { amount, date }|null }} record */
function writeCardInfo(record) {
    const cardIncomeText = formatMoney(Number(record.amount) || 0);
    const payload = {
        amount: cardIncomeText,
        updateDate: record.updateDate ? String(record.updateDate) : '',
        todayCredited: formatMoney(Number(record.todayCredited) || 0),
    };
    const yesterday = normalizeYesterday(record.yesterday);
    if (yesterday) {
        payload.yesterday = yesterday;
    }
    wx.setStorageSync(CARD_INFO_KEY, payload);
    wx.setStorageSync(CARD_STORAGE_KEY, cardIncomeText);
    return cardIncomeText;
}

/**
 * 设置页保存：只改卡面金额，todayCredited 归零；updateDate / yesterday 原样保留。
 */
function saveCardAmountFromSettings(amountInput) {
    const info = readCardInfo();
    return writeCardInfo({
        amount: amountInput,
        updateDate: info.updateDate,
        todayCredited: 0,
        yesterday: info.yesterday,
    });
}

module.exports = {
    readCardInfo,
    writeCardInfo,
    saveCardAmountFromSettings,
    formatMoney,
};
