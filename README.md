# salary_count

**小羊碎银记** — 微信小程序：按日薪与固定上下班时间，实时显示本班工资，支持提现入「小金库」。数据仅存本机，不上传服务器。

## 仓库布局

```
salary_count/
├── README.md                 本说明（仓库级）
├── docs/
│   ├── 开发日志.md           按日期的产品与工程记录
│   └── 规划日志.md           中长期设想（非已实现功能）
└── main/                     ★ 用微信开发者工具导入这一层
    ├── project.config.json
    ├── README.md             工程说明与目录
    ├── 代码阅读指南.md       零基础阅读顺序与概念
    └── miniprogram/          小程序源码
```

## 当前版本（v1）

| 页面 | 路径 | 作用 |
| --- | --- | --- |
| 输入页 | `pages/index` | 日薪 + 上下班时间 → 写入 `salaryConfig` → 跳转薪资页 |
| 薪资页 | `pages/salary` | 实时计薪、提现、倒计时与进度条 |
| 组件 | `components/vault-bag` | 牛皮纸袋展示小金库累计金额 |

本地存储键：`salaryConfig`、`salaryPouch`（无云开发、无第三方框架）。

## 快速开始

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入项目，目录选择 **`salary_count/main`**。
3. 编译运行：首页填日薪与时间 →「上班」→ 薪资页。

详细文件说明见 [`main/代码阅读指南.md`](main/代码阅读指南.md)；功能与设计演进见 [`docs/开发日志.md`](docs/开发日志.md)。

## 技术栈

- 微信原生小程序（`compileType: miniprogram`）
- 样式单位 `rpx`，逻辑与界面注释写在 `.js` / `.wxml` / `.wxss`（`.json` 不支持注释）
