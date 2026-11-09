/**
 * 首页：填写日薪与上下班时间，校验后写入本地并跳转薪资页。
 *
 * 本地存储键 salaryConfig：{ dailySalary, startTime, endTime }
 * dailySalary 存字符串，避免用户输入「300.5」时被 Number 提前丢精度展示。
 */
Page({
    data: {
        appName: '小羊碎银记',
        /** 日薪默认值，与 input 双向绑定 */
        dailySalary: '300',
        startTime: '09:00',
        endTime: '18:00',
    },

    /** 日薪输入：digit 类型允许小数点，值始终留在 data.dailySalary */
    onSalaryInput(e) {
        this.setData({
            dailySalary: e.detail.value,
        });
    },

    onStartChange(e) {
        this.setData({
            startTime: e.detail.value,
        });
    },

    onEndChange(e) {
        this.setData({
            endTime: e.detail.value,
        });
    },

    /**
     * 「上班」：校验 → 持久化 → 打开薪资页（不经过服务端）。
     */
    onStartWork() {
        const { dailySalary, startTime, endTime } = this.data;
        const trimmed = String(dailySalary).trim();
        if (!trimmed) {
            wx.showToast({ title: '请输入日薪', icon: 'none' });
            return;
        }
        const salary = Number(trimmed);
        if (!Number.isFinite(salary) || salary <= 0) {
            wx.showToast({ title: '日薪须为正数', icon: 'none' });
            return;
        }

        wx.setStorageSync('salaryConfig', {
            dailySalary: trimmed,
            startTime,
            endTime,
        });

        wx.navigateTo({
            url: '/pages/salary/salary',
        });
    },
});
