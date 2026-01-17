// Tool ID to route slug mapping
export const toolRouteMap: Record<string, string> = {
  "compound-calc": "compound-calculator",
  "fear-greed": "fear-greed",
  "airdrop-checker": "airdrop-tracker",
  "exchange-airdrop": "exchange-airdrop",
  "impermanent-loss": "impermanent-loss",
  "apy-calculator": "apy-calculator",
  "roi-calculator": "roi-calculator",
  "first-million": "first-million",
  "position-calculator": "position-calculator",
  "values-corrector": "values-corrector",
  "hourly-wage-revealer": "hourly-wage",
  "gas-tracker": "gas-tracker",
  "token-scanner": "token-scanner",
  "portfolio-tracker": "portfolio-tracker",
  "macro-dashboard": "macro-dashboard",
  "market-yields": "market-yields",
  "stock-ranker": "god-mode/stock-ranker",
  "index-yields": "god-mode/index-yields",
  "commodity-yields": "god-mode/commodity-yields",
  "crypto-yields": "god-mode/crypto-yields",
  "price-tester": "price-tester",
  "average-down": "average-down",
  "panic-simulator": "panic-simulator",
  "contract-calculator": "contract-calculator",
};

export function getToolRoute(toolId: string): string {
  return `/tools/${toolRouteMap[toolId] || toolId}`;
}

