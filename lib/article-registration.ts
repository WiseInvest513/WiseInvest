export type RegistrationCallout = {
  title: string;
  href?: string;
  code?: string;
  codeLabel: "邀请码" | "优惠码";
  benefitText?: string;
};

// Plain Markdown remains useful in exported drafts. Only explicit invitation
// callouts are promoted to cards; ordinary quoted links keep their formatting.
export function parseRegistrationCallout(line: string): RegistrationCallout | undefined {
  const match = line.trim().match(/^> (.+) · (?:(邀请码|优惠码)：\*\*([A-Za-z0-9_-]+)\*\*|邀请链接)(?: · 福利：(.+))?$/);
  if (!match) return undefined;
  const link = match[1].match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
  const title = link?.[1] ?? match[1];
  if (!/^(注册|开通|申请|领取|使用)\s/.test(title)) return undefined;
  if (!link && (!match[3] || /[\[\]()]/.test(title))) return undefined;
  return {
    title,
    href: link?.[2],
    code: match[3],
    codeLabel: match[2] === "优惠码" ? "优惠码" : "邀请码",
    benefitText: match[4],
  };
}

export function hasRegistrationCallout(content: string): boolean {
  return content.split("\n").some(line => Boolean(parseRegistrationCallout(line)));
}
