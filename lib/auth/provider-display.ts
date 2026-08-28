const loginProviderLabels: Record<string, string> = {
  google: "谷歌",
  github: "GitHub",
  "email-otp": "邮箱验证码",
  password: "邮箱密码",
};

export function getLoginProviderLabel(provider: string) {
  return loginProviderLabels[provider] ?? provider;
}

export function getLoginProviderLabels(accounts: { provider: string }[]) {
  const labels = accounts.map((account) => getLoginProviderLabel(account.provider));
  return Array.from(new Set(labels));
}
