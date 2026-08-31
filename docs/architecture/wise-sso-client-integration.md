# Wise SSO Client Integration

Status: V1 implementation guide
Identity Provider: `https://wise-invest.org`

Wise Invest 主站是 Wise ID 的身份中心。其他 Wise 产品站点不要直接读取主站数据库，也不要依赖 `.wise-invest.org` 共享 cookie。外部站点应作为 OAuth/OIDC client，通过 Authorization Code + PKCE 接入。

## Provider endpoints

```txt
Issuer: https://wise-invest.org
Discovery: https://wise-invest.org/.well-known/openid-configuration
JWKS: https://wise-invest.org/.well-known/jwks.json
Authorization: https://wise-invest.org/oauth/authorize
Token: https://wise-invest.org/oauth/token
UserInfo: https://wise-invest.org/oauth/userinfo
```

## Register a client

在主站后台进入：

```txt
/admin/sso
```

创建客户端时配置：

```txt
Name: Wise ETF
Client ID: wise_etf
Redirect URI: https://wise-etf.com/api/auth/callback/wise
Scopes: openid profile email wise.membership
PKCE: enabled
Enabled: true
```

`client_secret` 只在创建或轮换时显示一次。后台不会保存明文，只保存 hash。

## Required client environment variables

在 `wise-etf.com` 或其他客户端网站配置：

```txt
WISE_AUTH_ISSUER=https://wise-invest.org
WISE_AUTH_CLIENT_ID=wise_etf
WISE_AUTH_CLIENT_SECRET=<generated client_secret>
WISE_AUTH_SCOPE=openid profile email wise.membership
WISE_AUTH_CALLBACK_URL=https://wise-etf.com/api/auth/callback/wise
```

如果客户端本地开发需要测试，在主站 SSO Client 里额外加入：

```txt
http://localhost:3000/api/auth/callback/wise
http://127.0.0.1:3000/api/auth/callback/wise
```

## Authorization request

客户端将用户跳转到：

```txt
https://wise-invest.org/oauth/authorize
  ?response_type=code
  &client_id=wise_etf
  &redirect_uri=https%3A%2F%2Fwise-etf.com%2Fapi%2Fauth%2Fcallback%2Fwise
  &scope=openid%20profile%20email%20wise.membership
  &state=<random_state>
  &nonce=<random_nonce>
  &code_challenge=<pkce_challenge>
  &code_challenge_method=S256
```

如果用户没有登录，主站会先进入 `/login`。登录完成后进入明确的授权确认页，展示客户端名称、申请资料和当前会员等级；只有用户点击“同意授权并继续”后才签发授权码并回跳到客户端的 `redirect_uri`。用户取消时返回标准 `access_denied` 错误。

## Token exchange

客户端后端收到 `code` 后，向主站后端请求：

```http
POST https://wise-invest.org/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<authorization_code>
&redirect_uri=https%3A%2F%2Fwise-etf.com%2Fapi%2Fauth%2Fcallback%2Fwise
&client_id=wise_etf
&client_secret=<generated client_secret>
&code_verifier=<pkce_verifier>
```

返回：

```json
{
  "access_token": "...",
  "id_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email wise.membership"
}
```

## UserInfo

客户端可用 `access_token` 获取用户资料：

```http
GET https://wise-invest.org/oauth/userinfo
Authorization: Bearer <access_token>
```

示例返回：

```json
{
  "sub": "YXXXXXXXXXXXX",
  "wise_user_id": "YXXXXXXXXXXXX",
  "user_id": "clxxxx",
  "email": "user@example.com",
  "email_verified": true,
  "name": "Wise User",
  "picture": "https://...",
  "membership_tier": "VIP"
}
```

客户端必须创建自己的本地 session。不要把 Wise 的 `access_token` 当作长期 session cookie 使用。

## Production environment on Wise main site

主站生产环境必须配置：

```txt
WISE_SSO_ISSUER=https://wise-invest.org
WISE_SSO_PRIVATE_KEY=<RS256 private key PEM, newline escaped if needed>
WISE_SSO_KEY_ID=wise-sso-2026-08
```

可以使用下面命令生成私钥：

```bash
openssl genrsa -out wise-sso-private.pem 2048
```

再将 PEM 内容放入 Vercel 环境变量。换行可以保留，也可以替换成 `\n`。

## V1 boundary

V1 支持 Wise 自有产品接入，不作为开放第三方 OAuth 平台使用。

V1 暂不做：

- refresh token
- scope 细粒度授权弹窗
- 第三方开发者自助注册
- 多 key 自动轮换

这些可以在接入第二个或第三个独立产品后再升级。
