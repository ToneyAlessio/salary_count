/**
 * 薪资页：按班次线性计薪、每秒刷新、提现入袋。
 *
 * 存储：
 * - salaryConfig（首页写入）：日薪与上下班时间
 * - salaryPouch：{ balance, lastWithdrawAt, withdrawnThisShift, shiftKey }
 *   balance 跨班次累计；换班次时本班 withdrawn / lastWithdrawAt 重置，余额保留
 *
 * 展示规则：
 * - 「实时薪资」= 本班自上次提现时刻起赚取的金额（提现后从 0 再涨）
 * - 未到上班：界面实时与袋子上均显示 0.00（袋内 balance 仍持久化，仅展示为 0）
 * - 提现：把当前实时金额累加进 balance，并记入 withdrawnThisShift，刷新 lastWithdrawAt
 */

const POUCH_STORAGE_KEY = 'salaryPouch';

/** 「HH:mm」→ 当天 0 点起的分钟数，用于比较上下班先后 */
function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/**
 * 根据「当前时刻」解析本班次的绝对起止时间（Date 对象）。
 * 支持夜班：若 end ≤ start（如 22:00–06:00），结束时间算到次日；
 * 若当前还在凌晨、未到今日上班点，则整段窗口回拨到「昨天上班～昨/今下班」。
 */
function resolveShiftWindow(now, startTime, endTime) {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const overnight = endMins <= startMins;

    const start = new Date(now);
    start.setSeconds(0, 0);
    start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);

    const end = new Date(now);
    end.setSeconds(0, 0);
    end.setHours(Math.floor(endMins / 60), endMins % 60, 0, 0);

    if (overnight) {
        end.setDate(end.getDate() + 1);
        if (now.getTime() < start.getTime()) {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
        }
    }

    return { start, end };
}

/** 用班次起止时间戳拼唯一键，用于识别是否进入新一班 */
function shiftKey(start, end) {
    return `${start.getTime()}_${end.getTime()}`;
}

function formatMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        return '0.00';
    }
    return n.toFixed(2);
}

/**
 * 截至 now，本班次应得工资总额（线性：在上班～下班区间内按时间比例 × 日薪，封顶 daily）。
 */
function totalEarnedUntil(now, start, end, daily) {
    if (now.getTime() <= start.getTime()) {
        return 0;
    }
    const endT = Math.min(now.getTime(), end.getTime());
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0 || endT <= start.getTime()) {
        return 0;
    }
    const elapsed = endT - start.getTime();
    return Math.min(daily, (daily * elapsed) / totalMs);
}

/**
 * 自上次提现起至 now 的应得段（同样按班次总时长线性折算日薪）。
 * lastWithdrawAt 为毫秒时间戳；无提现则从上班时刻起算。
 */
function liveEarnedSinceWithdraw(now, start, end, daily, lastWithdrawAt) {
    if (now.getTime() < start.getTime()) {
        return 0;
    }
    const segStart = lastWithdrawAt
        ? Math.max(start.getTime(), lastWithdrawAt)
        : start.getTime();
    const endT = Math.min(now.getTime(), end.getTime());
    if (endT <= segStart) {
        return 0;
    }
    const totalMs = end.getTime() - start.getTime();
    const segMs = endT - segStart;
    return (daily * segMs) / totalMs;
}

/**
 * 读取小金库记录。shiftKey 与当前班次不一致时：保留 balance，重置本班提现字段。
 */
function readPouchRecord(shiftKeyValue) {
    const raw = wx.getStorageSync(POUCH_STORAGE_KEY) || {};
    const balance = Number(raw.balance) || 0;
    if (raw.shiftKey !== shiftKeyValue) {
        return {
            balance,
            lastWithdrawAt: null,
            withdrawnThisShift: 0,
            shiftKey: shiftKeyValue,
        };
    }
    return {
        balance,
        lastWithdrawAt: raw.lastWithdrawAt ?? null,
        withdrawnThisShift: Number(raw.withdrawnThisShift) || 0,
        shiftKey: shiftKeyValue,
    };
}

function writePouchRecord(record) {
    wx.setStorageSync(POUCH_STORAGE_KEY, record);
}

/**
 * 根据当前时间与配置，算出界面所需的全部展示字段（纯函数，不写存储）。
 * phase: 'before' | 'working' | 'after'
 * liveAmount: 数值型实时金额，供提现按钮使用
 */
function computeView(now, dailySalary, startTime, endTime, pouchRecord) {
    const daily = Number(dailySalary);
    const invalid = {
        liveSalaryText: '0.00',
        pouchSalaryText: '0.00',
        countdownLabel: '距离上班',
        countdownSeconds: 0,
        progressPercent: 0,
        statusText: '配置无效',
        canWithdraw: false,
        liveAmount: 0,
        phase: 'before',
    };

    if (!Number.isFinite(daily) || daily <= 0) {
        return invalid;
    }

    const { start, end } = resolveShiftWindow(now, startTime, endTime);
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) {
        return { ...invalid, statusText: '时间配置有误' };
    }

    const t = now.getTime();

    // 上班前：不计薪，袋与实时均展示 0
    if (t < start.getTime()) {
        const countdownSeconds = Math.max(
            0,
            Math.floor((start.getTime() - t) / 1000),
        );
        return {
            liveSalaryText: '0.00',
            pouchSalaryText: '0.00',
            countdownLabel: '距离上班',
            countdownSeconds,
            progressPercent: 0,
            statusText: '未到上班',
            canWithdraw: false,
            liveAmount: 0,
            phase: 'before',
        };
    }

    const secondsToEnd = Math.max(0, Math.floor((end.getTime() - t) / 1000));
    let progressPercent = Math.min(
        100,
        Math.max(0, ((t - start.getTime()) / totalMs) * 100),
    );

    let statusText = '上班中';
    let countdownLabel = '距离下班';
    let countdownSeconds = secondsToEnd;
    let phase = 'working';

    if (t >= end.getTime()) {
        statusText = '已下班';
        countdownSeconds = 0;
        progressPercent = 100;
        phase = 'after';
    }

    const totalEarned = totalEarnedUntil(now, start, end, daily);
    let liveRaw = liveEarnedSinceWithdraw(
        now,
        start,
        end,
        daily,
        pouchRecord.lastWithdrawAt,
    );
    // 已提现部分不能再次出现在「实时」里
    const maxLive = Math.max(0, totalEarned - pouchRecord.withdrawnThisShift);
    liveRaw = Math.min(liveRaw, maxLive);

    return {
        liveSalaryText: formatMoney(liveRaw),
        pouchSalaryText: formatMoney(pouchRecord.balance),
        countdownLabel,
        countdownSeconds,
        progressPercent,
        statusText,
        canWithdraw: liveRaw > 0.0005 && t < end.getTime(),
        liveAmount: liveRaw,
        phase,
    };
}

Page({
    data: {
        startTime: '',
        endTime: '',
        liveSalaryText: '0.00',
        pouchSalaryText: '0.00',
        countdownLabel: '距离上班',
        countdownSeconds: 0,
        progressPercent: 0,
        statusText: '',
        canWithdraw: false,
        /** 进度条右端文案：「09:00 上班」或「18:00 下班」 */
        progressFootRight: '',
    },

    onLoad() {
        const config = wx.getStorageSync('salaryConfig');
        if (!config || !config.dailySalary) {
            wx.showToast({ title: '请先填写工钱配置', icon: 'none' });
            setTimeout(() => {
                wx.navigateBack({ delta: 1 });
            }, 1500);
            return;
        }

        // 日薪与定时器放在实例上，避免每秒 setData 大对象
        this._dailySalary = config.dailySalary;
        this._timer = null;
        /** 进入「未到上班」时记录的初始倒计时，用于上班前进度条从 0→100 */
        this._initialWaitSeconds = null;
        this.setData({
            startTime: config.startTime || '09:00',
            endTime: config.endTime || '18:00',
        });

        this.syncPouchShift();
        this.refreshSalary();
        this.startTicker();
    },

    onShow() {
        this.syncPouchShift();
        this.refreshSalary();
        this.startTicker();
    },

    onHide() {
        this.stopTicker();
    },

    onUnload() {
        this.stopTicker();
    },

    /** 若本地 shiftKey 与当前班次不一致，写回重置后的记录（保留 balance） */
    syncPouchShift() {
        const { startTime, endTime } = this.data;
        const { start, end } = resolveShiftWindow(new Date(), startTime, endTime);
        const key = shiftKey(start, end);
        const next = readPouchRecord(key);
        const raw = wx.getStorageSync(POUCH_STORAGE_KEY) || {};
        if (raw.shiftKey !== key) {
            writePouchRecord(next);
        }
        this._pouchRecord = next;
    },

    startTicker() {
        this.stopTicker();
        this._timer = setInterval(() => {
            this.refreshSalary();
        }, 1000);
    },

    stopTicker() {
        if (this._timer != null) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },

    /**
     * 每秒（或进入页面时）用当前时间戳重算金额，不用累加，避免切后台误差。
     */
    refreshSalary() {
        const { startTime, endTime } = this.data;
        const now = new Date();
        const { start, end } = resolveShiftWindow(now, startTime, endTime);
        const key = shiftKey(start, end);
        this._pouchRecord = readPouchRecord(key);
        const view = computeView(
            now,
            this._dailySalary,
            startTime,
            endTime,
            this._pouchRecord,
        );
        this._liveAmount = view.liveAmount;

        let progressPercent = view.progressPercent;
        // 上班前：进度条表示「等待上班」流逝比例，与上班中「已工作比例」语义不同
        if (view.phase === 'before') {
            if (this._initialWaitSeconds == null) {
                this._initialWaitSeconds = view.countdownSeconds;
            }
            if (this._initialWaitSeconds > 0) {
                const waited =
                    this._initialWaitSeconds - view.countdownSeconds;
                progressPercent = Math.min(
                    100,
                    Math.max(0, (waited / this._initialWaitSeconds) * 100),
                );
            }
        } else {
            this._initialWaitSeconds = null;
        }

        const progressFootRight =
            view.phase === 'before'
                ? `${this.data.startTime} 上班`
                : `${this.data.endTime} 下班`;

        this.setData({
            liveSalaryText: view.liveSalaryText,
            pouchSalaryText: view.pouchSalaryText,
            countdownLabel: view.countdownLabel,
            countdownSeconds: view.countdownSeconds,
            progressPercent,
            statusText: view.statusText,
            canWithdraw: view.canWithdraw,
            progressFootRight,
        });
    },

    /** 将当前实时金额写入小金库，并清零实时段起点（lastWithdrawAt = now） */
    onWithdraw() {
        const amount = this._liveAmount || 0;
        if (amount <= 0.0005) {
            wx.showToast({ title: '暂无可提现金额', icon: 'none' });
            return;
        }

        const { startTime, endTime } = this.data;
        const now = new Date();
        const { start, end } = resolveShiftWindow(now, startTime, endTime);
        const key = shiftKey(start, end);
        const record = readPouchRecord(key);

        record.balance = (Number(record.balance) || 0) + amount;
        record.withdrawnThisShift = (Number(record.withdrawnThisShift) || 0) + amount;
        record.lastWithdrawAt = now.getTime();
        record.shiftKey = key;

        writePouchRecord(record);
        this._pouchRecord = record;
        this.refreshSalary();

        wx.showToast({ title: '已入小金库', icon: 'success' });
    },
});
