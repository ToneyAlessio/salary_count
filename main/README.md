# 工资计时器

一个实时显示工作收入的微信小程序：设置工资参数，点开始后，屏幕上的金额随时间增长。

## 当前进度

第 1 步：工程骨架跑通（首页仅显示标题，未接业务逻辑）。

## 目录结构

```
salary_for_count/
├─ miniprogram/           小程序源码根目录
│  ├─ app.js              总入口
│  ├─ app.json            全局配置：页面注册、窗口样式
│  ├─ app.wxss            全局样式
│  ├─ sitemap.json        搜索索引配置
│  └─ pages/index/        首页（一个页面 = js + json + wxml + wxss 四个文件）
├─ project.config.json    开发者工具配置（AppID、编译类型）
└─ README.md
```

## 开发环境

- 微信开发者工具
- 原生小程序框架，无 npm、无云开发、无第三方框架
- 数据计划保存在本机（`wx.setStorageSync`）

## 备注

`.json` 文件不支持注释，代码解释统一写在 `.js`、`.wxml`、`.wxss` 中。
