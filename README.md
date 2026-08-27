# 项目路线图 Roadmap

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-原生组件样式-000000)](https://ui.shadcn.com)
[![Radix UI](https://img.shields.io/badge/Radix_UI-无障碍组件原语-EBABF1)](https://www.radix-ui.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-TypeSafe_SQLite-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![libSQL](https://img.shields.io/badge/libSQL-Turso-4E2BE8)](https://turso.tech)
[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

一个轻量的公开项目路线图与功能投票平台：访客可以查看开发进展、为自己期待的功能投票、提议新功能，管理员负责维护路线图内容。

## 项目预览

![项目路线图预览](https://picui.ogmua.cn/s1/2026/08/27/6a9032520c19a.webp)

## 功能特性

- **路线图看板** —— 按状态分四列展示：待办池 / 即将开始 / 进行中 / 已完成，支持列内拖拽排序
- **功能投票** —— 匿名访客也能投票，同一用户对同一目标仅计一票（数据库唯一约束防重复）
- **投票提议** —— 登录用户可发起新功能提议并收集票数，票数高的提议由管理员晋升为路线图任务
- **项目分组** —— 路线图任务可按项目分类打色标，支持增删改
- **角色管理** —— 通过邮箱白名单识别管理员，管理员可添加/编辑/删除任务和提议
- **AI 描述润色**（可选）—— 配置 AI 接口后，提交的功能描述可一键润色得更专业

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 应用框架 | [Next.js 16](https://nextjs.org)（App Router，React Server Components，默认 Turbopack） |
| UI | [React 19](https://react.dev) · [shadcn/ui](https://ui.shadcn.com)（基于 Radix 原语的原生组件样式） · [Tailwind CSS 4](https://tailwindcss.com) · [lucide-react](https://lucide.dev) |
| 语言 | [TypeScript 5](https://www.typescriptlang.org) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| 数据库 | [SQLite / libSQL](https://docs.turso.tech)，兼容 Turso 云端或任意 libSQL 实例 |
| 认证（可选） | 标准 OAuth 授权码流程，可对接任意 Casdoor 实例 |

## 快速开始

前置要求：Node.js 20.9+（Next.js 16 的最低版本要求）。

```bash
git clone <仓库地址>
cd roadmap
npm install
```

创建 `.env.local` 并按需填写：

### 必填（数据库）

| 变量 | 说明 |
| --- | --- |
| `TURSO_DATABASE_URL` | libSQL 连接地址，如 `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | libSQL 访问令牌 |

### 可选（登录认证）

不配置时应用照常运行，登录按钮会显示但不会发起跳转；访客可浏览页面并匿名投票。

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_CASDOOR_SERVER_URL` | 你的认证服务地址（例：`https://sso.example.com`） |
| `NEXT_PUBLIC_CASDOOR_CLIENT_ID` | OAuth 客户端 ID |
| `NEXT_PUBLIC_CASDOOR_CLIENT_SECRET` | OAuth 客户端密钥 |
| `NEXT_PUBLIC_CASDOOR_APP_NAME` | 认证平台中的应用名 |
| `NEXT_PUBLIC_CASDOOR_ORG_NAME` | 所属组织名 |
| `NEXT_PUBLIC_ADMIN_EMAILS` | 管理员邮箱白名单，逗号分隔 |

> 注意：`NEXT_PUBLIC_` 前缀的变量会在构建时打包进前端代码，需要在执行 `npm run build` 的环境中提前设置好，而不是只在运行时注入。

### 可选（AI 描述润色）

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | AI 服务密钥（缺失则跳过该功能） |
| `OPENAI_BASE_URL` | 兼容 OpenAI 的接口地址，默认 `https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | 模型名称，默认 `deepseek-v4-flash` |

启动：

```bash
npm run dev          # 开发模式
npm run build && npm run start   # 生产模式
```

首次使用需初始化数据库表结构，浏览器访问一次：

```
GET http://localhost:3000/api/init
```

Casdoor 回调地址请在认证平台后台设置为 `https://你的域名/`。

## API 一览

| 接口 | 说明 |
| --- | --- |
| `GET /api/init` | 创建数据库表 |
| `/api/roadmap` | 路线图任务的增删改查与排序 |
| `/api/projects` | 项目分组管理 |
| `/api/vote-requests` | 投票提议管理 |
| `/api/vote` | 投票记录查询与提交 |
| `/api/auth/callback` | OAuth 登录回调换取用户信息 |
| `POST /api/polish` | AI 润色文本 |

## 目录结构

```
src/
├── app/
│   ├── api/            # Route Handlers（Node 运行时）
│   ├── layout.tsx      # 全局布局与元信息
│   └── page.tsx        # 主页面（看板 + 投票区）
├── components/
│   ├── header.tsx      # 顶栏（品牌与登录状态）
│   ├── roadmap-board.tsx   # 路线图看板
│   ├── vote-section.tsx    # 投票提议区
│   └── ui/             # Radix 封装的基础组件
├── hooks/use-app.tsx   # 全局状态与 API 调用
├── lib/
│   ├── db.ts           # Drizzle + libSQL 连接与建表
│   ├── schema.ts       # 表结构定义
│   └── casdoor.ts      # 认证配置与环境变量读取
└── types/index.ts      # 共享类型
```

## 部署

标准 Next.js（Node 运行时）应用，可自托管于任何服务器：

```bash
npm install
npm run build
npm run start        # 默认监听 3000 端口，可用 -p 调整
```

也可以直接托管到任意支持 Node.js 的平台。将 `.env.local` 中列出的变量按目标平台的环境变量方式配置即可；数据库推荐使用 [Turso](https://turso.tech) 云端实例。
