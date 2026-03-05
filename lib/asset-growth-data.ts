/**
 * 100 美元按资产类别划分的增长情况
 * 数据来源：1965-2025 年
 */
export const ASSET_GROWTH_DATA = [
  { year: 1965, stocks: 112, gold: 100, corporateBonds: 103, governmentBonds: 101, realEstate: 102, cash: 104 },
  { year: 1966, stocks: 101, gold: 100, corporateBonds: 100, governmentBonds: 104, realEstate: 103, cash: 109 },
  { year: 1967, stocks: 125, gold: 100, corporateBonds: 101, governmentBonds: 102, realEstate: 105, cash: 114 },
  { year: 1968, stocks: 139, gold: 112, corporateBonds: 105, governmentBonds: 105, realEstate: 110, cash: 120 },
  { year: 1969, stocks: 127, gold: 118, corporateBonds: 103, governmentBonds: 100, realEstate: 117, cash: 128 },
  { year: 1970, stocks: 132, gold: 106, corporateBonds: 109, governmentBonds: 117, realEstate: 127, cash: 136 },
  { year: 1971, stocks: 151, gold: 124, corporateBonds: 124, governmentBonds: 128, realEstate: 132, cash: 142 },
  { year: 1972, stocks: 179, gold: 185, corporateBonds: 139, governmentBonds: 132, realEstate: 136, cash: 148 },
  { year: 1973, stocks: 153, gold: 320, corporateBonds: 145, governmentBonds: 137, realEstate: 141, cash: 158 },
  { year: 1974, stocks: 114, gold: 531, corporateBonds: 138, governmentBonds: 139, realEstate: 155, cash: 170 },
  { year: 1975, stocks: 156, gold: 400, corporateBonds: 153, governmentBonds: 144, realEstate: 166, cash: 180 },
  { year: 1976, stocks: 193, gold: 383, corporateBonds: 184, governmentBonds: 168, realEstate: 179, cash: 189 },
  { year: 1977, stocks: 179, gold: 470, corporateBonds: 202, governmentBonds: 170, realEstate: 205, cash: 199 },
  { year: 1978, stocks: 191, gold: 644, corporateBonds: 208, governmentBonds: 168, realEstate: 238, cash: 213 },
  { year: 1979, stocks: 226, gold: 1459, corporateBonds: 204, governmentBonds: 170, realEstate: 270, cash: 235 },
  { year: 1980, stocks: 298, gold: 1680, corporateBonds: 197, governmentBonds: 164, realEstate: 290, cash: 262 },
  { year: 1981, stocks: 284, gold: 1132, corporateBonds: 214, governmentBonds: 178, realEstate: 305, cash: 298 },
  { year: 1982, stocks: 342, gold: 1309, corporateBonds: 276, governmentBonds: 236, realEstate: 307, cash: 331 },
  { year: 1983, stocks: 419, gold: 1089, corporateBonds: 321, governmentBonds: 244, realEstate: 322, cash: 361 },
  { year: 1984, stocks: 444, gold: 878, corporateBonds: 371, governmentBonds: 277, realEstate: 337, cash: 397 },
  { year: 1985, stocks: 583, gold: 931, corporateBonds: 460, governmentBonds: 349, realEstate: 362, cash: 427 },
  { year: 1986, stocks: 691, gold: 1108, corporateBonds: 562, governmentBonds: 433, realEstate: 396, cash: 454 },
  { year: 1987, stocks: 731, gold: 1379, corporateBonds: 568, governmentBonds: 412, realEstate: 428, cash: 481 },
  { year: 1988, stocks: 852, gold: 1169, corporateBonds: 657, governmentBonds: 446, realEstate: 458, cash: 514 },
  { year: 1989, stocks: 1120, gold: 1136, corporateBonds: 764, governmentBonds: 525, realEstate: 479, cash: 557 },
  { year: 1990, stocks: 1086, gold: 1100, corporateBonds: 808, governmentBonds: 557, realEstate: 475, cash: 600 },
  { year: 1991, stocks: 1414, gold: 1006, corporateBonds: 940, governmentBonds: 641, realEstate: 475, cash: 633 },
  { year: 1992, stocks: 1520, gold: 948, corporateBonds: 1069, governmentBonds: 701, realEstate: 478, cash: 656 },
  { year: 1993, stocks: 1672, gold: 1116, corporateBonds: 1244, governmentBonds: 801, realEstate: 489, cash: 676 },
  { year: 1994, stocks: 1694, gold: 1092, corporateBonds: 1229, governmentBonds: 736, realEstate: 501, cash: 705 },
  { year: 1995, stocks: 2324, gold: 1103, corporateBonds: 1476, governmentBonds: 909, realEstate: 510, cash: 745 },
  { year: 1996, stocks: 2851, gold: 1052, corporateBonds: 1554, governmentBonds: 922, realEstate: 522, cash: 784 },
  { year: 1997, stocks: 3795, gold: 827, corporateBonds: 1729, governmentBonds: 1014, realEstate: 543, cash: 824 },
  { year: 1998, stocks: 4870, gold: 820, corporateBonds: 1870, governmentBonds: 1165, realEstate: 578, cash: 865 },
  { year: 1999, stocks: 5887, gold: 827, corporateBonds: 1888, governmentBonds: 1069, realEstate: 623, cash: 906 },
  { year: 2000, stocks: 5355, gold: 782, corporateBonds: 2065, governmentBonds: 1247, realEstate: 681, cash: 961 },
  { year: 2001, stocks: 4721, gold: 788, corporateBonds: 2242, governmentBonds: 1316, realEstate: 726, cash: 994 },
  { year: 2002, stocks: 3684, gold: 989, corporateBonds: 2513, governmentBonds: 1515, realEstate: 796, cash: 1010 },
  { year: 2003, stocks: 4728, gold: 1186, corporateBonds: 2824, governmentBonds: 1521, realEstate: 874, cash: 1021 },
  { year: 2004, stocks: 5236, gold: 1241, corporateBonds: 3115, governmentBonds: 1589, realEstate: 993, cash: 1035 },
  { year: 2005, stocks: 5490, gold: 1462, corporateBonds: 3275, governmentBonds: 1635, realEstate: 1127, cash: 1068 },
  { year: 2006, stocks: 6347, gold: 1801, corporateBonds: 3448, governmentBonds: 1667, realEstate: 1146, cash: 1120 },
  { year: 2007, stocks: 6695, gold: 2375, corporateBonds: 3617, governmentBonds: 1837, realEstate: 1084, cash: 1170 },
  { year: 2008, stocks: 4248, gold: 2478, corporateBonds: 3492, governmentBonds: 2206, realEstate: 954, cash: 1187 },
  { year: 2009, stocks: 5349, gold: 3098, corporateBonds: 4189, governmentBonds: 1961, realEstate: 918, cash: 1189 },
  { year: 2010, stocks: 6142, gold: 4004, corporateBonds: 4583, governmentBonds: 2127, realEstate: 880, cash: 1190 },
  { year: 2011, stocks: 6271, gold: 4486, corporateBonds: 5145, governmentBonds: 2468, realEstate: 846, cash: 1191 },
  { year: 2012, stocks: 7267, gold: 4741, corporateBonds: 5629, governmentBonds: 2542, realEstate: 900, cash: 1192 },
  { year: 2013, stocks: 9604, gold: 3432, corporateBonds: 5565, governmentBonds: 2310, realEstate: 997, cash: 1193 },
  { year: 2014, stocks: 10902, gold: 3436, corporateBonds: 6163, governmentBonds: 2558, realEstate: 1041, cash: 1193 },
  { year: 2015, stocks: 11053, gold: 3020, corporateBonds: 6071, governmentBonds: 2591, realEstate: 1096, cash: 1194 },
  { year: 2016, stocks: 12354, gold: 3265, corporateBonds: 6770, governmentBonds: 2609, realEstate: 1154, cash: 1197 },
  { year: 2017, stocks: 15023, gold: 3678, corporateBonds: 7390, governmentBonds: 2682, realEstate: 1225, cash: 1209 },
  { year: 2018, stocks: 14388, gold: 3644, corporateBonds: 7155, governmentBonds: 2682, realEstate: 1281, cash: 1233 },
  { year: 2019, stocks: 18879, gold: 4339, corporateBonds: 8246, governmentBonds: 2940, realEstate: 1328, cash: 1259 },
  { year: 2020, stocks: 22281, gold: 5388, corporateBonds: 9120, governmentBonds: 3273, realEstate: 1466, cash: 1263 },
  { year: 2021, stocks: 28625, gold: 5185, corporateBonds: 9213, governmentBonds: 3129, realEstate: 1743, cash: 1264 },
  { year: 2022, stocks: 23462, gold: 5214, corporateBonds: 7810, governmentBonds: 2571, realEstate: 1841, cash: 1290 },
  { year: 2023, stocks: 29576, gold: 5905, corporateBonds: 8492, governmentBonds: 2671, realEstate: 1946, cash: 1358 },
  { year: 2024, stocks: 36934, gold: 7438, corporateBonds: 8639, governmentBonds: 2627, realEstate: 2023, cash: 1429 },
  { year: 2025, stocks: 43480, gold: 12364, corporateBonds: 9241, governmentBonds: 2832, realEstate: 2055, cash: 1489 },
];

export const ASSET_LABELS: Record<string, string> = {
  stocks: "Stocks",
  gold: "Gold",
  corporateBonds: "Corporate Bonds",
  governmentBonds: "Government Bonds",
  realEstate: "Real Estate",
  cash: "Cash",
};

// 按 2025 年最终价值排序（高→低），便于图例与曲线顺序一致
export const ASSET_ORDER = [
  "stocks",
  "gold",
  "corporateBonds",
  "governmentBonds",
  "realEstate",
  "cash",
] as const;

// 亮色模式专业金融配色
export const ASSET_COLORS_LIGHT: Record<string, string> = {
  stocks: "#00A3E0",
  gold: "#F0A320",
  corporateBonds: "#00796B",
  governmentBonds: "#00897B",
  realEstate: "#D84315",
  cash: "#B0BEC5",
};

// 暗色模式配色（提高亮度以在深色背景上清晰可见）
export const ASSET_COLORS_DARK: Record<string, string> = {
  stocks: "#38bdf8",
  gold: "#fbbf24",
  corporateBonds: "#2dd4bf",
  governmentBonds: "#34d399",
  realEstate: "#fb923c",
  cash: "#94a3b8",
};

// 默认导出亮色配色，页面按主题切换使用
export const ASSET_COLORS = ASSET_COLORS_LIGHT;
