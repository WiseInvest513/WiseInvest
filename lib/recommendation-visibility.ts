export function suppressAutomaticRecommendation(pathname: string) {
  return pathname === "/" || pathname === "/point" || pathname.startsWith("/point/") || pathname === "/admin" || pathname.startsWith("/admin/");
}
