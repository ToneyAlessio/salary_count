/**
 * 小金库展示组件（牛皮纸袋）。纯 UI，不参与计薪与存储。
 * 父页面传入已格式化的金额字符串 amount，例如「128.50」。
 */
Component({
    properties: {
        amount: {
            type: String,
            value: '0.00',
        },
    },
});
