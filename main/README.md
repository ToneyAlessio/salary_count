# 工资计时器（小羊碎银记）

按**日薪**和**固定上下班时间**，在薪资页每秒刷新「实时工资」；可**提现**到小金库（牛皮纸袋展示累计金额）。配置与小金库均保存在本机。

## 当前进度

**v1 已完成**：输入页 + 薪资页 + 小金库组件；已去掉多款式选择与 `vault-pick` 页面；核心逻辑见 `pages/salary/salary.js`（含详细中文注释）。

## 目录结构

```
main/
├── project.config.json       开发者工具配置（AppID、编译类型）
├── project.private.config.json
├── README.md
├── 代码阅读指南.md
└── miniprogram/
    ├── app.js                入口（无全局状态）
    ├── app.json              页面注册：index、salary
    ├── app.wxss              全局 page 样式
    ├── sitemap.json
    ├── pages/
    │   ├── index/            工钱配置
    │   └── salary/           实时计薪、提现、进度
    └── components/
        └── vault-bag/        小金库 UI（仅牛皮纸袋）
```

## 业务流程（简）

```mermaid
flowchart LR
    A[首页填日薪与时间] --> B[salaryConfig 本地存储]
    B --> C[薪资页每秒重算]
    C --> D{提现?}
    D -->|是| E[salaryPouch.balance 累加]
    D -->|否| C
```

## 开发环境

- 微信开发者工具
- 原生小程序，无 npm、无云开发
- `wx.setStorageSync` / `wx.getStorageSync`

## 阅读代码

1. [`代码阅读指南.md`](代码阅读指南.md) — 文件地图与概念
2. `pages/index/index.js` — 校验与写入配置
3. `pages/salary/salary.js` — 班次窗口、线性计薪、提现（注释最完整）

## 备注

- 导航栏标题：首页 `index.json` 为「小羊碎银记」；`app.json` 默认「工资计时器」（页面 json 优先生效）。
- `.json` 不支持注释；说明写在对应 `.js` / `.wxml` / `.wxss` 或本目录文档中。
