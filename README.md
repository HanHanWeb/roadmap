# 项目路线图 Roadmap

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-原生组件样式-000000)](https://ui.shadcn.com)
[![Radix UI](https://img.shields.io/badge/Radix_UI-无障碍组件原语-EBABF1)](https://www.radix-ui.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-TypeSafe_SQLite-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![libSQL](https://img.shields.io/badge/libSQL-Turso-4E2BE8)](https://turso.tech)
[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

一个轻量的公开项目路线图与功能投票平台：访客无需登录即可查看开发进展、为自己期待的功能投票；管理员通过环境变量中预设的邮箱密码登录，维护路线图内容。

## 项目预览

![项目路线图预览](https://picui.ogmua.cn/s1/2026/08/27/6a9032520c19a.webp)

## 功能特性

- **路线图看板** —— 按状态分四列展示：待办池 / 即将开始 / 进行中 / 已完成，支持列内拖拽排序，可按投票数或时间排序
- **功能投票** —— 访客无需登录即可投票，同一用户对同一目标仅计一票（数据库唯一约束 + 事务防重复）
- **投票提议** —— 管理员可发起新功能提议并收集票数，「转为任务」一键晋升为路线图任务且票数随迁
- **项目分组** —— 路线图任务可按项目分类打色标，支持增删改
- **管理员登录** —— 部署前在环境变量中配置邮箱和密码，登录即管理员；所有写操作在服务端校验身份（签名 HttpOnly 会话 Cookie）
- **深色模式** —— 跟随系统偏好，支持手动切换并记忆选择
- **AI 描述润色**（可选）—— 配置 AI 接口后，提交的功能描述可一键润色得更专业（含限流保护）

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 应用框架 | [Next.js 16](https://nextjs.org)（App Router，React Server Components，默认 Turbopack） |
| UI | [React 19](https://react.dev) · [shadcn/ui](https://ui.shadcn.com)（基于 Radix 原语的原生组件样式） · [Tailwind CSS 4](https://tailwindcss.com) · [lucide-react](https://lucide.dev) |
| 语言 | [TypeScript 5](https://www.typescriptlang.org) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| 数据库 | [SQLite / libSQL](https://docs.turso.tech)，兼容 Turso 云端或任意 libSQL 实例 |
| 认证 | 环境变量管理员账号 + HMAC-SHA256 签名会话 Cookie（HttpOnly） |

## 快速开始

前置要求：Node.js 20.9+（Next.js 16 的最低版本要求）。

```bash
git clone https://github.com/HanHanWeb/roadmap.git
cd roadmap
npm install
```

### ⚙️ 环境变量配置（重要）

复制项目根目录的 `.env.local`（不存在则新建），**部署前务必把管理员账号密码改成你自己的值**：

```bash
# ---------- 数据库（必填） ----------
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=你的-libSQL-访问令牌

# ---------- 管理员账号（部署前必须修改！） ----------
# 用于页面右上角「登录」的邮箱和密码，登录后即为管理员
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-123

# 会话签名密钥，用于给登录 Cookie 签名
# 生成方式：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=请替换为随机长字符串

# ---------- AI 描述润色（可选） ----------
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# OPENAI_MODEL=deepseek-v4-flash
```

#### 关于管理员账号密码的说明

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_EMAIL` | ✅ | 管理员登录邮箱，匹配时不区分大小写 |
| `ADMIN_PASSWORD` | ✅ | 管理员登录密码 |
| `AUTH_SECRET` | 推荐 | 登录会话 Cookie 的签名密钥；不设置时会退化为用 `ADMIN_PASSWORD` 签名 |

请务必注意：

1. **不要使用文档中的示例值上线**。`admin@example.com` / `change-me-123` 仅为占位示例，部署前请全部换成自己的强密码。
2. 这些变量只在**服务端**读取，不会打包进前端代码；`.env*.local` 已被 `.gitignore` 排除，不会被提交到仓库。
3. **修改 `ADMIN_PASSWORD` 或 `AUTH_SECRET` 后，所有已登录的会话立即失效**（旧 Cookie 签名不再通过校验），需要重新登录。
4. `AUTH_SECRET` 建议用上面命令生成的 64 位随机 hex；更换它同样会使所有现有登录失效。
5. 在 Vercel / Railway 等平台部署时，请在平台的环境变量设置中配置这些变量，而不是依赖 `.env.local` 文件。

### 初始化数据库表

首次部署后，浏览器或 curl 访问一次：

```
GET https://你的域名/api/init
```

返回 `{"ok":true}` 即建表完成，之后无需再调用。

### 启动

```bash
npm run dev                      # 开发模式（默认 http://localhost:3000）
npm run build && npm run start   # 生产模式
```

## 使用说明

- **访客**：无需登录，可直接浏览路线图、搜索排序、为任务和提议投票（身份由浏览器本地匿名 ID 标识）。
- **管理员**：点击右上角「登录」，输入 `.env.local` 中配置的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 即可管理任务、项目分组、功能提议，并使用 AI 润色。

## API 一览

| 接口 | 方法 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `GET /api/init` | GET | 公开 | 创建数据库表（仅需调用一次） |
| `/api/roadmap` | GET | 公开 | 获取路线图任务 |
| `/api/roadmap` | POST / PUT / DELETE | 管理员 | 任务的增删改与拖拽排序 |
| `/api/roadmap` | PATCH | 公开 | 任务投票（登录态切换） |
| `/api/projects` | GET | 公开 | 获取项目分组 |
| `/api/projects` | POST / PUT / DELETE | 管理员 | 项目分组增删改 |
| `/api/vote-requests` | GET | 公开 | 获取功能提议 |
| `/api/vote-requests` | POST / PUT / DELETE | 管理员 | 功能提议增删改 |
| `/api/vote-requests` | PATCH | 公开 | 提议投票（登录态切换） |
| `/api/vote-requests/promote` | POST | 管理员 | 提议转为路线图任务（原子操作，票数随迁） |
| `/api/vote` | GET / POST | 公开 | 查询/切换投票状态（事务保证计数一致） |
| `POST /api/auth/login` | POST | 公开 | 管理员登录，成功后下发签名会话 Cookie |
| `POST /api/auth/logout` | POST | 公开 | 退出登录，清除会话 Cookie |
| `POST /api/polish` | POST | 管理员 | AI 润色文本（限流：每 IP 每分钟 10 次） |

## 目录结构

```
src/
├── app/
│   ├── api/            # Route Handlers（Node 运行时）
│   │   ├── auth/       # 登录 / 登出
│   │   ├── roadmap/    # 路线图任务
│   │   ├── projects/   # 项目分组
│   │   ├── vote-requests/  # 功能提议与「转为任务」
│   │   ├── vote/       # 投票记录
│   │   └── polish/     # AI 润色
│   ├── layout.tsx      # 全局布局、元信息与主题初始化
│   └── page.tsx        # 主页面（看板 + 投票区）
├── components/
│   ├── header.tsx          # 顶栏（主题切换与登录入口）
│   ├── theme-toggle.tsx    # 深色模式切换
│   ├── roadmap-board.tsx   # 路线图看板
│   ├── vote-section.tsx    # 投票提议区
│   └── ui/                 # Radix 封装的基础组件
├── hooks/use-app.tsx   # 全局状态与 API 调用
├── lib/
│   ├── db.ts           # Drizzle + libSQL 连接（单例）与建表
│   ├── schema.ts       # 表结构定义
│   ├── auth.ts         # 会话签名与请求鉴权
│   └── rate-limit.ts   # 简单内存限流
└── types/index.ts      # 共享类型
```

## 部署

标准 Next.js（Node 运行时）应用，可自托管于任何服务器：

```bash
npm install
npm run build
npm run start        # 默认监听 3000 端口，可用 -p 调整
```

也可以直接托管到任意支持 Node.js 的平台。部署清单：

1. 在平台环境变量中配置 **数据库连接**（`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`）；
2. **修改管理员账号密码**（`ADMIN_EMAIL` / `ADMIN_PASSWORD`），并设置随机 `AUTH_SECRET`——再次强调不要用示例值；
3. （可选）配置 AI 润色的 `OPENAI_API_KEY` 等变量；
4. 部署完成后访问一次 `/api/init` 完成建表。

数据库推荐使用 [Turso](https://turso.tech) 云端实例，免费额度足够个人项目使用。
