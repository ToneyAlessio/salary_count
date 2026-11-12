/**
 * 首页：填写日薪与上下班时间，校验后写入本地并跳转薪资页。
 *
 * 本地存储键 salaryConfig：{ dailySalary, startTime, endTime }
 * dailySalary 存字符串，避免用户输入「300.5」时被 Number 提前丢精度展示。
 *
 * 点「上班」会清零本班小金库 salaryPouch（新班次计薪）；工资卡仅在「下班」时更新，不在此清零。
 */
const POUCH_STORAGE_KEY = 'salaryPouch';

/** 新一次上班：袋内余额与本班提现记录归零；工资卡金额保留，由当日最后一次下班覆盖 */
function resetIncomeForNewShift() {
    wx.setStorageSync(POUCH_STORAGE_KEY, {
        balance: 0,
        lastWithdrawAt: null,
        withdrawnThisShift: 0,
        shiftKey: '',
        clockedOutAt: null,
    });
}

Page({
    data: {
        appName: '小羊薪资记',
        /** 日薪默认值，与 input 双向绑定 */
        dailySalary: '300',
        startTime: '09:00',
        endTime: '18:00',
    },

    /** 首页首次加载时回显已保存配置；不在 onShow 中读取，避免覆盖尚未保存的输入。 */
    onLoad() {
        let config;
        try {
            config = wx.getStorageSync('salaryConfig');
        } catch (error) {
            // 读取失败时保留默认值，不清除或覆盖原存储。
            console.warn('读取工钱配置失败，暂用默认值');
            return;
        }
        if (!config || typeof config !== 'object' || Array.isArray(config)) {
            return;
        }

        const restored = {};
        // 兼容字符串和数字格式的旧记录，回显始终使用字符串，供输入框计算宽度。
        if (typeof config.dailySalary === 'string' || typeof config.dailySalary === 'number') {
            const salaryText = String(config.dailySalary).trim();
            const salary = Number(salaryText);
            if (Number.isFinite(salary) && salary > 0) {
                restored.dailySalary = salaryText;
            }
        }

        // 每项独立校验：缺失或非法字段保留默认值，不影响其他有效字段的回显。
        const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (typeof config.startTime === 'string' && timePattern.test(config.startTime)) {
            restored.startTime = config.startTime;
        }
        if (typeof config.endTime === 'string' && timePattern.test(config.endTime)) {
            restored.endTime = config.endTime;
        }
        if (Object.keys(restored).length > 0) {
            this.setData(restored);
        }
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

        resetIncomeForNewShift();

        wx.navigateTo({
            url: '/pages/salary/salary',
        });
    },

    onOpenSettings() {
        wx.navigateTo({
            url: '/pages/settings/settings',
            fail: (err) => {
                console.error('打开设置页失败', err);
                wx.showModal({
                    title: '打不开设置页',
                    content:
                        '请确认：① 导入目录为 salary_count/main；② 工具栏点「编译」；③ 仍失败则「清缓存 → 全部清除」后再编译。',
                    showCancel: false,
                });
            },
        });
    },
});
