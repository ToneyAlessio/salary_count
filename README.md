# salary_count

**小羊薪资记** — 微信小程序。填好日薪和上下班时间后，在薪资页看本班工资往上爬；可以提现进小金库，下班把袋里的钱累进工资卡。数据只留在本机，不上传。

## 仓库里有什么

```
salary_count/
├── README.md                 ← 仓库总览（你正在看的这份）
├── docs/
│   ├── 文档说明.md           ← 各文档干啥、先看哪份
│   ├── 开发日志.md           ← 已经做完的事、踩过的坑
│   └── 规划日志.md           ← 还没做的想法
└── main/                     ★ 微信开发者工具导入这一层
    ├── project.config.json
    ├── README.md
    ├── 代码阅读指南.md
    └── miniprogram/
```

当前版本 **v1.1**：输入页、薪资页、小金库、工资卡；本地键 `salaryConfig`、`salaryPouch`、`salaryCardInfo`（旧版还带 `salaryCardAmount`）。原生小程序，无云开发。

| 页面/组件 | 路径 | 一句话 |
| --- | --- | --- |
| 输入页 | `pages/index` | 日薪 + 时间 →「上班」；右上角设置 |
| 设置页 | `pages/settings` | 工资卡卡面金额 |
| 薪资页 | `pages/salary` | 实时薪、提现、下班、进度条 |
| 小金库 | `components/vault-bag` | 本班袋内金额 |
| 工资卡 | `components/salary-card` | 累计入账（读 `salaryCardInfo`） |

## 跑起来

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入目录选 **`salary_count/main`**。
3. 首页填数 →「上班」→ 薪资页。

想顺着代码看：[`main/代码阅读指南.md`](main/代码阅读指南.md)。产品和版本细节：[`docs/开发日志.md`](docs/开发日志.md)。

## 技术栈

微信原生（`compileType: miniprogram`），样式用 `rpx`。注释写在 `.js` / `.wxml` / `.wxss`（`.json` 不能写注释）。
