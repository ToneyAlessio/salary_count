/**
 * 实时薪资阶梯文案：达到金额阈值时展示对应「能买什么」。
 * 按 amount 从高到低匹配，取当前所处最高档。
 */
const TIERS = [
    { amount: 15, label: '盒饭' },
    { amount: 7, label: '珍珠奶茶' },
    { amount: 1, label: '干脆面' },
];

/**
 * @param {number} liveAmount 当前实时薪（元）
 * @returns {{ amount: number, label: string, text: string } | null}
 */
function pickMilestone(liveAmount) {
    const n = Number(liveAmount) || 0;
    if (n < 0.999) {
        return null;
    }
    for (let i = 0; i < TIERS.length; i++) {
        const tier = TIERS[i];
        if (n >= tier.amount - 0.0005) {
            return {
                amount: tier.amount,
                label: tier.label,
                text: '≈ ' + tier.label,
            };
        }
    }
    return null;
}

module.exports = {
    TIERS,
    pickMilestone,
};
