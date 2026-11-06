// Shared by page headings and desktop/mobile directories.
const icon = (name: string) => `/images/articles/category-icons/${name}-ivory.webp`;

export const articleCategoryIcons = {
  domestic: icon("domestic"),
  index: icon("index"),
  strategy: icon("strategy"),
  crypto: icon("crypto"),
  predict: icon("predict"),
  onchain: icon("onchain"),
  broker: icon("broker"),
  bank: icon("bank"),
  transfers: icon("transfers"),
  vcard: icon("vcard"),
  simcard: icon("simcard"),
  ai: icon("ai"),
  outside: icon("outside"),
  web: icon("web"),
  VIP: icon("VIP"),
} as const;

export const articleLibraryIcons = {
  recommended: icon("reading"),
  series: icon("series"),
  all: icon("all"),
} as const;
