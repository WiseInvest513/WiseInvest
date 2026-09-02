# Wise SSO Client 通用接入模板

Status: Reusable implementation template
Identity Provider: `https://wise-invest.org`

这份模板用于把任意 Wise 自有网站接入 Wise ID。复制后只需要替换文中的占位符，不要让客户端网站直接读取 Wise Invest 数据库，也不要依赖跨子域共享 Cookie。

## 1. 需要替换的变量

```txt
{{PRODUCT_NAME}}        产品名称，例如 Wise Crypto
{{CLIENT_ID}}           唯一客户端 ID，例如 wise_crypto
{{PRODUCTION_ORIGIN}}   正式站点根地址，例如 https://crypto.wise-invest.org
{{CALLBACK_PATH}}       OAuth 回调路径，建议 /api/auth/callback/wise
{{LOCAL_ORIGIN}}        本地开发地址，例如 http://localhost:3000
```

替换后会得到：

```txt
正式回调：{{PRODUCTION_ORIGIN}}{{CALLBACK_PATH}}
本地回调：{{LOCAL_ORIGIN}}{{CALLBACK_PATH}}
```

回调地址必须逐字一致，包括协议、域名、`www`、端口、路径和末尾斜杠。

## 2. Wise Invest 主站配置

登录 Wise Invest 管理后台，进入：

```txt
https://www.wise-invest.org/admin/sso
```

新增一个 SSO Client：

```txt
名称：{{PRODUCT_NAME}}
Client ID：{{CLIENT_ID}}
回调地址：
{{PRODUCTION_ORIGIN}}{{CALLBACK_PATH}}
{{LOCAL_ORIGIN}}{{CALLBACK_PATH}}

授权范围：
openid
profile
email
wise.membership

启用客户端：是
要求 PKCE：是
```

创建后立即保存 `client_secret`。主站只保存密钥 hash，之后不会再次显示明文；遗失时需要轮换密钥。

回调地址保存后会同时成为授权校验与授权页 CSP 的唯一可信来源。不要再到主站代码或全站 CSP 中手工添加客户端域名。

## 3. 客户端网站环境变量

在新网站的本地环境和 Vercel 项目中分别配置：

```env
WISE_AUTH_ISSUER=https://wise-invest.org
WISE_AUTH_DISCOVERY_URL=https://www.wise-invest.org/.well-known/openid-configuration
WISE_AUTH_CLIENT_ID={{CLIENT_ID}}
WISE_AUTH_CLIENT_SECRET=<主站创建客户端时生成的密钥>
WISE_AUTH_SCOPE="openid profile email wise.membership"
WISE_AUTH_CALLBACK_URL={{PRODUCTION_ORIGIN}}{{CALLBACK_PATH}}
```

本地开发时，`WISE_AUTH_CALLBACK_URL` 改为：

```env
WISE_AUTH_CALLBACK_URL={{LOCAL_ORIGIN}}{{CALLBACK_PATH}}
```

密钥只能保存在服务端环境变量中，不能使用 `NEXT_PUBLIC_` 前缀，也不能提交到 Git。

## 4. 标准登录流程

客户端必须使用 OAuth 2.0 / OpenID Connect Authorization Code Flow，并启用 PKCE、`state` 和 `nonce`。

```txt
用户点击“使用 Wise ID 登录”
-> 客户端生成 state、nonce、code_verifier 和 S256 code_challenge
-> 跳转到 Wise authorization_endpoint
-> 用户在 Wise Invest 登录并确认授权
-> Wise Invest 使用 303 跳转到客户端 GET callback
-> 客户端后端校验 state，并用 code + code_verifier 换 token
-> 客户端验证 id_token 的签名、issuer、audience、nonce 和有效期
-> 客户端创建自己的本地用户和本地 session
-> 返回用户登录前页面
```

端点以 Discovery 文档返回值为准：

```txt
https://www.wise-invest.org/.well-known/openid-configuration
```

不要手写自定义 OAuth 协议，也不要把 Wise `access_token` 直接当作客户端网站的长期登录 Cookie。

## 5. 用户字段映射

至少保存稳定的 `sub`，它是跨产品识别同一个 Wise 用户的主键。邮箱和昵称都可能变化，不能替代 `sub`。

```txt
sub                -> wiseSubject / providerAccountId
wise_user_id       -> 展示用 Wise User ID
email              -> 用户邮箱
email_verified     -> 邮箱是否已验证
name               -> 昵称
picture            -> 头像
membership_tier    -> MEMBER / VIP / VIP_PLUS
```

权限必须由客户端服务端 session 和服务端接口执行。前端隐藏按钮不能作为权限控制。

## 6. 可直接交给客户端项目的开发提示词

复制下面内容到新网站的开发任务中，并先替换占位符：

```md
请在当前 {{PRODUCT_NAME}} 项目中接入 Wise Invest 统一登录。

身份提供方：
- Issuer: https://wise-invest.org
- Discovery: https://www.wise-invest.org/.well-known/openid-configuration

客户端配置：
- Client ID: {{CLIENT_ID}}
- Production origin: {{PRODUCTION_ORIGIN}}
- Redirect URI: {{PRODUCTION_ORIGIN}}{{CALLBACK_PATH}}
- Local redirect URI: {{LOCAL_ORIGIN}}{{CALLBACK_PATH}}
- Scopes: openid profile email wise.membership
- Require PKCE: true

实施要求：
1. 先检查当前框架、认证库、路由模式、数据库和 session 方案，优先复用成熟认证库。
2. 使用 OAuth 2.0 / OIDC Authorization Code Flow，不自定义登录协议。
3. 必须校验 PKCE S256、state、nonce、issuer、audience、签名和 token 有效期。
4. 登录按钮文案为“使用 Wise ID 登录”，点击后通过认证库生成授权请求。
5. callback 只接受标准 GET 授权回调；收到 code 后必须在服务端换取 token。
6. 使用 Discovery 和 JWKS 验证 id_token，不写死公钥。
7. 使用 sub 作为 Wise 用户的稳定外部身份标识，并创建客户端自己的本地用户和 session。
8. 保存并同步 wise_user_id、email、email_verified、name、picture、membership_tier。
9. 登录成功后返回用户发起登录前的页面。
10. 对受保护页面和 API 做服务端鉴权，会员权限不能只在前端判断。
11. client_secret 只能读取服务端环境变量，不得进入浏览器 bundle、日志或 Git。
12. 不读取 Wise Invest 数据库，不使用 .wise-invest.org 共享 Cookie。
13. 增加登录、回调错误、state/PKCE 失败和退出登录的测试。
14. 完成后提供所需环境变量清单、主站回调地址和端到端测试结果。

客户端环境变量：
WISE_AUTH_ISSUER=https://wise-invest.org
WISE_AUTH_DISCOVERY_URL=https://www.wise-invest.org/.well-known/openid-configuration
WISE_AUTH_CLIENT_ID={{CLIENT_ID}}
WISE_AUTH_CLIENT_SECRET=<secret>
WISE_AUTH_SCOPE="openid profile email wise.membership"
WISE_AUTH_CALLBACK_URL={{PRODUCTION_ORIGIN}}{{CALLBACK_PATH}}
```

## 7. 上线检查清单

- 主站 `/admin/sso` 中 Client 已启用。
- 正式和本地回调地址已加入白名单。
- 新增 Client 后无需修改或重新维护全站 CSP 域名列表。
- 客户端 Vercel 已配置生产环境变量并重新部署。
- `client_secret` 未出现在客户端代码或浏览器请求中。
- 未登录用户可以跳转到 Wise Invest。
- 已登录 Wise 用户可以看到授权确认页。
- 同意后以 GET 到达客户端 callback，不出现 405。
- callback 能校验 PKCE、state、nonce 和 id_token。
- 客户端创建自己的 session，并返回原页面。
- `MEMBER`、`VIP`、`VIP_PLUS` 权限在服务端生效。
- 拒绝授权、无效回调和过期授权码有明确错误页面。

## 8. 每增加一个网站时要做什么

每个网站都必须单独创建一个 SSO Client，并拥有独立的 `client_id`、`client_secret` 和回调地址白名单。不要让多个网站共用同一套客户端密钥。

例如：

```txt
Wise ETF    -> client_id: wise_etf
Wise Crypto -> client_id: wise_crypto
Wise Chain  -> client_id: wise_chain
```

接入新网站不需要修改 Wise ID 用户表，也不需要让用户重新注册 Wise ID。用户在新网站第一次授权后，客户端按 `sub` 创建或关联本地账户即可。
