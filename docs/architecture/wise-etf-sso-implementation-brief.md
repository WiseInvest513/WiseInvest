# Wise ETF 接入 Wise ID SSO 实施 Brief

Status: handoff brief for Wise ETF implementation
Identity Provider: `https://wise-invest.org`
Target Client: `wise_etf`

这份文档用于交给 Wise ETF 项目里的开发者或 Codex，让它按 Wise Invest 主站已经实现的 OAuth/OIDC 能力接入统一登录。

## 目标

在 `wise-etf.com` 增加「使用 Wise ID 登录」能力。用户点击登录后跳转到 Wise Invest 主站完成登录授权，再回到 Wise ETF，并在 Wise ETF 本地建立自己的登录 session。

最终链路：

```txt
wise-etf.com
-> https://wise-invest.org/oauth/authorize
-> Wise ID 登录 / 授权
-> https://wise-etf.com/api/auth/callback/wise
-> Wise ETF 创建本地 session
```

## 主站后台配置

在 Wise Invest 主站后台进入：

```txt
https://wise-invest.org/admin/sso
```

创建 SSO Client：

```txt
Client ID: wise_etf
Name: Wise ETF
Redirect URI:
https://wise-etf.com/api/auth/callback/wise
http://localhost:3000/api/auth/callback/wise

Scopes:
openid
profile
email
wise.membership

Enabled: true
Require PKCE: true
```

如果 Wise ETF 也使用 `www.wise-etf.com`，需要额外加入：

```txt
https://www.wise-etf.com/api/auth/callback/wise
```

如果正式站统一无 `www`，则不需要加 `www` 回调。

创建成功后保存生成的 `Client Secret`。这个 secret 只显示一次，不要写进前端代码，不要提交到 Git。

## Wise ETF 环境变量

在 Wise ETF 项目里配置：

```env
WISE_AUTH_ISSUER=https://wise-invest.org
WISE_AUTH_CLIENT_ID=wise_etf
WISE_AUTH_CLIENT_SECRET=<主站后台生成的 client secret>
WISE_AUTH_SCOPE=openid profile email wise.membership
NEXTAUTH_URL=https://wise-etf.com
NEXTAUTH_SECRET=<Wise ETF 自己生成的随机 secret>
```

如果 Wise ETF 使用 Auth.js v5，变量名可能是：

```env
AUTH_URL=https://wise-etf.com
AUTH_SECRET=<Wise ETF 自己生成的随机 secret>
```

本地开发时：

```env
NEXTAUTH_URL=http://localhost:3000
```

或按 Wise ETF 实际端口调整。回调地址必须和主站 SSO Client 里填写的地址完全一致。

## Wise Invest Provider 信息

Wise ETF 不要硬编码所有 endpoint。优先读取 discovery：

```txt
https://wise-invest.org/.well-known/openid-configuration
```

主站当前暴露：

```txt
Issuer: https://wise-invest.org
Discovery: https://wise-invest.org/.well-known/openid-configuration
JWKS: https://wise-invest.org/.well-known/jwks.json
Authorization: https://wise-invest.org/oauth/authorize
Token: https://wise-invest.org/oauth/token
UserInfo: https://wise-invest.org/oauth/userinfo
```

## 推荐实现方式：Auth.js / NextAuth

如果 Wise ETF 是 Next.js 项目，优先用 Auth.js / NextAuth 的 OIDC Provider，不要自己手写 OAuth 协议。

示例：

```ts
import NextAuth from "next-auth";

const issuer = process.env.WISE_AUTH_ISSUER ?? "https://wise-invest.org";

const handler = NextAuth({
  providers: [
    {
      id: "wise",
      name: "Wise ID",
      type: "oidc",
      issuer,
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId: process.env.WISE_AUTH_CLIENT_ID,
      clientSecret: process.env.WISE_AUTH_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            process.env.WISE_AUTH_SCOPE ??
            "openid profile email wise.membership",
        },
      },
      checks: ["pkce", "state", "nonce"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.email ?? profile.sub,
          email: profile.email,
          image: profile.picture,
          wiseUserId: profile.wise_user_id,
          membershipTier: profile.membership_tier,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile) {
        token.wiseUserId = profile.wise_user_id;
        token.membershipTier = profile.membership_tier;
      }
      if (account?.access_token) {
        token.wiseAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.wiseUserId = token.wiseUserId;
      session.user.membershipTier = token.membershipTier;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

实际文件路径根据 Wise ETF 项目的 Next.js 版本决定：

```txt
App Router: app/api/auth/[...nextauth]/route.ts
Pages Router: pages/api/auth/[...nextauth].ts
```

## 登录按钮

在 Wise ETF 登录页或导航栏增加：

```ts
import { signIn } from "next-auth/react";

function WiseLoginButton() {
  return (
    <button onClick={() => signIn("wise", { callbackUrl: "/" })}>
      使用 Wise ID 登录
    </button>
  );
}
```

如果用户从受保护页面进入登录页，`callbackUrl` 应该保留原页面路径，让登录后回到原页面。

## 会员状态使用

Wise 主站会在 `userinfo` / `id_token` 里提供：

```json
{
  "sub": "YXXXXXXXXXXXX",
  "wise_user_id": "YXXXXXXXXXXXX",
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "picture": "https://...",
  "membership_tier": "MEMBER"
}
```

Wise ETF 展示文案建议：

```txt
MEMBER -> 普通用户
VIP -> Wise VIP
VIP_PLUS -> Wise SVIP
```

权限判断必须在服务端做。前端可以隐藏按钮，但不能只靠前端限制。

示例逻辑：

```ts
const canUseVipFeature =
  session.user.membershipTier === "VIP" ||
  session.user.membershipTier === "VIP_PLUS";
```

## 本地验收

1. Wise ETF 本地启动。
2. 打开 `http://localhost:3000/login`。
3. 点击「使用 Wise ID 登录」。
4. 跳转到 `https://wise-invest.org/oauth/authorize`。
5. Wise ID 登录成功后回跳到：

```txt
http://localhost:3000/api/auth/callback/wise
```

6. Wise ETF 本地 session 成功建立。
7. 页面可以显示：

```txt
用户昵称
邮箱
头像
Wise User ID
会员等级
```

## 线上验收

1. Wise ETF 线上环境变量已配置。
2. Wise Invest 主站 SSO Client 已启用。
3. Wise Invest 主站 `/admin/system` 中这些项应为已配置：

```txt
Postgres 数据库
Auth Secret
站点 Auth URL
Wise SSO Issuer
Wise SSO 私钥
```

4. 打开 `https://wise-etf.com/login`。
5. 点击「使用 Wise ID 登录」。
6. 登录完成后回到 `https://wise-etf.com`。
7. Wise ETF 能读取并展示 Wise 用户信息。

## 常见错误

### redirect_uri_mismatch

Wise ETF 发起登录时的 `redirect_uri` 和 Wise Invest 后台登记的不完全一致。

检查：

```txt
协议：http / https
域名：wise-etf.com / www.wise-etf.com
端口：3000 / 3002
路径：/api/auth/callback/wise
末尾 slash
```

### invalid_client

通常是 `client_id` 或 `client_secret` 不对。

检查 Wise ETF 环境变量：

```txt
WISE_AUTH_CLIENT_ID
WISE_AUTH_CLIENT_SECRET
```

### invalid_grant

通常是授权码过期、重复使用、PKCE verifier 不匹配，或回调地址不一致。

优先让 Auth.js / NextAuth 自动处理 PKCE，不要自己拼接。

### JWKS / id_token 验证失败

Wise Invest 主站可能没有配置 `WISE_SSO_PRIVATE_KEY`，或者配置后没有重新部署。

## 给 Wise ETF Codex 的执行提示词

```txt
请在当前 Wise ETF 项目中接入 Wise Invest 统一登录。

目标：
- 增加 Wise ID 登录入口。
- 使用 OAuth 2.0 / OIDC Authorization Code + PKCE。
- Identity Provider 是 https://wise-invest.org。
- 不要自己实现自定义 OAuth 协议。
- 不要读取 Wise Invest 主站数据库。
- 登录成功后在 Wise ETF 本地建立 session。
- session 中需要保留 Wise User ID、email、name、picture、membership_tier。
- 会员等级展示为：MEMBER=普通用户，VIP=Wise VIP，VIP_PLUS=Wise SVIP。
- 权限判断必须服务端执行，不能只做前端隐藏。

主站 SSO Client：
- client_id: wise_etf
- redirect_uri: https://wise-etf.com/api/auth/callback/wise
- local redirect_uri: http://localhost:3000/api/auth/callback/wise
- scopes: openid profile email wise.membership
- require PKCE: true

请先检查 Wise ETF 当前技术栈和路由结构。
如果是 Next.js，优先用 Auth.js / NextAuth 的 OIDC Provider。
如果项目已有认证系统，请复用现有 session 架构，不要重写整个登录系统。

需要新增或修改：
- 登录页 Wise ID 登录按钮
- OAuth callback route
- session / jwt callback
- 用户信息展示
- 需要登录或 VIP 权限的服务端保护逻辑
- .env.example，不要提交真实 secret

验收：
- 本地点击 Wise ID 登录，可以跳到 wise-invest.org 登录。
- 登录后回到 Wise ETF。
- 页面能显示头像、昵称、邮箱、Wise User ID 和会员等级。
- 未登录用户访问受保护页面时跳登录，登录后回原页面。
- VIP 页面或功能需要服务端检查 membership_tier。
```
