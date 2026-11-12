/**
 * 设置：仅修改工资卡卡面金额；保存时 todayCredited 归零，不改 updateDate / yesterday。
 */
const {
    readCardInfo,
    saveCardAmountFromSettings,
} = require('../../utils/cardStorage.js');

Page({
    data: {
        cardAmount: '',
    },

    onLoad() {},

    onShow() {
        const info = readCardInfo();
        this.setData({
            cardAmount: info.amount === '0.00' ? '' : info.amount,
        });
    },

    onCardAmountInput(e) {
        this.setData({
            cardAmount: e.detail.value,
        });
    },

    onSave() {
        const trimmed = String(this.data.cardAmount).trim();
        if (!trimmed) {
            wx.showToast({ title: '请输入卡面金额', icon: 'none' });
            return;
        }
        const amount = Number(trimmed);
        if (!Number.isFinite(amount) || amount < 0) {
            wx.showToast({ title: '金额须为非负数', icon: 'none' });
            return;
        }

        saveCardAmountFromSettings(trimmed);
        wx.showToast({ title: '已保存', icon: 'success' });
        setTimeout(() => {
            wx.navigateBack({ delta: 1 });
        }, 400);
    },
});
