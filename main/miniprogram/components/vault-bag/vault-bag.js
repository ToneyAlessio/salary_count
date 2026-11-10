/**
 * 小金库展示组件（牛皮纸袋）。
 * amount：累计入账金额；canClockOut：上班中即可点「下班」。
 */
Component({
    properties: {
        amount: {
            type: String,
            value: '0.00',
        },
        canClockOut: {
            type: Boolean,
            value: false,
        },
    },

    methods: {
        onClockOutTap() {
            if (!this.properties.canClockOut) {
                return;
            }
            this.triggerEvent('clockout');
        },
    },
});
