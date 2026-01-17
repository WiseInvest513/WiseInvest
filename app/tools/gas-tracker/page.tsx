"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Circle, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ParallaxBackground } from "@/components/motion/ParallaxBackground";

type ChainId = "eth" | "sol" | "arb" | "bsc" | "base" | "btc" | "sui" | "aptos" | "tron" | "op";

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 mb-2"></div>
    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
  </div>
);

interface ChainGasData {
  safe?: number;
  standard: number;
  fast?: number;
  unit: "Gwei" | "Microlamports" | "Sats/vB" | "MIST" | "SUN" | "Gwei";
  timestamp: number;
  // Bitcoin specific
  nextBlock?: number;
  thirtyMin?: number;
  oneHour?: number;
  // L2 savings
  l2Savings?: number; // Percentage savings vs ETH L1
}

interface ChainConfig {
  id: ChainId;
  name: string;
  symbol: string;
  isL2: boolean;
  l1Chain?: ChainId; // For L2 chains, reference to L1
  color: {
    primary: string;
    gradient: string;
    glow: string;
    rgb: string; // RGB values for dynamic gradients
  };
  rpcUrl?: string;
  apiUrl?: string;
  gasLimits: {
    transfer: number;
    swap: number;
    nft: number;
  };
}

const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  eth: {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    isL2: false,
    color: {
      primary: "amber",
      gradient: "from-amber-400 via-orange-500 to-amber-600",
      glow: "from-amber-400/30 to-amber-600/10",
      rgb: "251, 191, 36",
    },
    apiUrl: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
  sol: {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    isL2: false,
    color: {
      primary: "purple",
      gradient: "from-purple-400 via-pink-500 to-cyan-500",
      glow: "from-purple-400/30 to-cyan-600/10",
      rgb: "168, 85, 247",
    },
    apiUrl: "https://api.helius.xyz/v0/priority-fee?api-key=demo",
    gasLimits: {
      transfer: 5000,
      swap: 100000,
      nft: 50000,
    },
  },
  arb: {
    id: "arb",
    name: "Arbitrum",
    symbol: "ARB",
    isL2: true,
    l1Chain: "eth",
    color: {
      primary: "blue",
      gradient: "from-blue-400 via-indigo-500 to-blue-600",
      glow: "from-blue-400/30 to-blue-600/10",
      rgb: "59, 130, 246",
    },
    apiUrl: "https://api.arbiscan.io/api?module=gastracker&action=gasoracle",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
  bsc: {
    id: "bsc",
    name: "BSC",
    symbol: "BNB",
    isL2: false,
    color: {
      primary: "yellow",
      gradient: "from-yellow-400 via-amber-500 to-yellow-600",
      glow: "from-yellow-400/30 to-yellow-600/10",
      rgb: "234, 179, 8",
    },
    apiUrl: "https://api.bscscan.com/api?module=gastracker&action=gasoracle",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
  base: {
    id: "base",
    name: "Base",
    symbol: "ETH",
    isL2: true,
    l1Chain: "eth",
    color: {
      primary: "navy",
      gradient: "from-blue-600 via-blue-500 to-cyan-500",
      glow: "from-blue-600/30 to-cyan-600/10",
      rgb: "0, 82, 204", // Coinbase Blue
    },
    apiUrl: "https://api.basescan.org/api?module=gastracker&action=gasoracle",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
  btc: {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    isL2: false,
    color: {
      primary: "orange",
      gradient: "from-orange-500 via-amber-600 to-orange-700",
      glow: "from-orange-400/30 to-orange-600/10",
      rgb: "249, 115, 22",
    },
    apiUrl: "https://mempool.space/api/v1/fees/recommended",
    gasLimits: {
      transfer: 250, // Average vBytes for a standard transaction
      swap: 500,
      nft: 400,
    },
  },
  sui: {
    id: "sui",
    name: "Sui",
    symbol: "SUI",
    isL2: false,
    color: {
      primary: "ocean",
      gradient: "from-cyan-400 via-blue-500 to-teal-600",
      glow: "from-cyan-400/30 to-teal-600/10",
      rgb: "6, 182, 212",
    },
    apiUrl: "https://api.suiscan.xyz/api/v1/gas-price",
    gasLimits: {
      transfer: 1000,
      swap: 50000,
      nft: 30000,
    },
  },
  aptos: {
    id: "aptos",
    name: "Aptos",
    symbol: "APT",
    isL2: false,
    color: {
      primary: "indigo",
      gradient: "from-indigo-400 via-purple-500 to-indigo-600",
      glow: "from-indigo-400/30 to-indigo-600/10",
      rgb: "99, 102, 241",
    },
    apiUrl: "https://api.aptoscan.com/api/v1/gas-price",
    gasLimits: {
      transfer: 1000,
      swap: 50000,
      nft: 30000,
    },
  },
  tron: {
    id: "tron",
    name: "Tron",
    symbol: "TRX",
    isL2: false,
    color: {
      primary: "red",
      gradient: "from-red-400 via-pink-500 to-red-600",
      glow: "from-red-400/30 to-red-600/10",
      rgb: "239, 68, 68",
    },
    apiUrl: "https://api.trongrid.io/v1/accounts/energy",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
  op: {
    id: "op",
    name: "Optimism",
    symbol: "ETH",
    isL2: true,
    l1Chain: "eth",
    color: {
      primary: "red",
      gradient: "from-red-500 via-orange-500 to-red-600",
      glow: "from-red-400/30 to-red-600/10",
      rgb: "239, 68, 68",
    },
    apiUrl: "https://api-optimistic.etherscan.io/api?module=gastracker&action=gasoracle",
    gasLimits: {
      transfer: 21000,
      swap: 150000,
      nft: 100000,
    },
  },
};

interface TrendData {
  time: string;
  standard: number;
}

interface TokenPrice {
  eth: number;
  sol: number;
  bnb: number;
  btc: number;
  sui: number;
  apt: number;
  trx: number;
}

export default function GasTrackerPage() {
  const [activeChain, setActiveChain] = useState<ChainId>("eth");
  const [gasData, setGasData] = useState<Record<ChainId, ChainGasData | null>>({
    eth: null,
    sol: null,
    arb: null,
    bsc: null,
    base: null,
    btc: null,
    sui: null,
    aptos: null,
    tron: null,
    op: null,
  });
  const [tokenPrices, setTokenPrices] = useState<TokenPrice>({
    eth: 0,
    sol: 0,
    bnb: 0,
    btc: 0,
    sui: 0,
    apt: 0,
    trx: 0,
  });
  const [trendData, setTrendData] = useState<Record<ChainId, TrendData[]>>({
    eth: [],
    sol: [],
    arb: [],
    bsc: [],
    base: [],
    btc: [],
    sui: [],
    aptos: [],
    tron: [],
    op: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [pulse, setPulse] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fetchQueueRef = useRef<Set<ChainId>>(new Set());

  // Fetch EVM chain gas data with multiple fallbacks
  const fetchEVMGasData = async (chain: ChainId): Promise<ChainGasData | null> => {
    const config = CHAIN_CONFIGS[chain];
    
    // RPC endpoints (most reliable)
    const rpcUrls: Record<ChainId, string[]> = {
      eth: [
        "https://eth.llamarpc.com",
        "https://rpc.ankr.com/eth",
        "https://ethereum.publicnode.com",
      ],
      bsc: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.defibit.io",
        "https://rpc.ankr.com/bsc",
      ],
      arb: [
        "https://arb1.arbitrum.io/rpc",
        "https://rpc.ankr.com/arbitrum",
      ],
      base: [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
      ],
      op: [
        "https://mainnet.optimism.io",
        "https://rpc.ankr.com/optimism",
      ],
      sol: [],
      btc: [],
      sui: [],
      aptos: [],
      tron: [],
    };

    // Try RPC endpoints first (most reliable)
    const rpcList = rpcUrls[chain];
    for (const rpcUrl of rpcList) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_gasPrice",
            params: [],
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await response.json();
        if (data.result) {
          const gasPrice = parseInt(data.result, 16) / 1e9; // Convert from Wei to Gwei
          if (gasPrice > 0) {
            // For EVM chains, try to get fee history to estimate safe/standard/fast
            try {
              const feeHistoryResponse = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id: 2,
                  method: "eth_feeHistory",
                  params: ["0x5", "latest", [25, 50, 75]],
                }),
                signal: AbortSignal.timeout(8000),
              });
              
              const feeHistoryData = await feeHistoryResponse.json();
              if (feeHistoryData.result && feeHistoryData.result.reward) {
                const rewards = feeHistoryData.result.reward.flat();
                if (rewards.length > 0) {
                  const sortedRewards = rewards
                    .map((r: string[]) => parseInt(r[0], 16) / 1e9)
                    .filter((r: number) => r > 0)
                    .sort((a: number, b: number) => a - b);
                  
                  if (sortedRewards.length > 0) {
                    const safe = Math.round(sortedRewards[0]);
                    const standard = Math.round(gasPrice);
                    const fast = Math.round(sortedRewards[sortedRewards.length - 1]);
                    
                    return {
                      safe: safe > 0 ? safe : undefined,
                      standard,
                      fast: fast > standard ? fast : undefined,
                      unit: "Gwei",
                      timestamp: Date.now(),
                    };
                  }
                }
              }
            } catch (feeErr) {
              // If fee history fails, just use gas price
            }
            
            return {
              standard: Math.round(gasPrice),
              unit: "Gwei",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next RPC endpoint
        continue;
      }
    }

    // Fallback: Try API endpoint (if available)
    if (config.apiUrl) {
      try {
        const response = await fetch(config.apiUrl, { 
          signal: AbortSignal.timeout(8000) 
        });
        const data = await response.json();

        if (data.result && data.result.SafeGasPrice) {
          const safe = parseInt(data.result.SafeGasPrice);
          const standard = parseInt(data.result.ProposeGasPrice || data.result.ProposeGasPrice || "0");
          const fast = parseInt(data.result.FastGasPrice || "0");
          
          if (standard > 0) {
            return {
              safe: safe > 0 ? safe : undefined,
              standard,
              fast: fast > 0 ? fast : undefined,
              unit: "Gwei",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // API failed, continue
      }
    }

    return null;
  };

  // Fetch Bitcoin fees
  const fetchBitcoinGasData = async (): Promise<ChainGasData | null> => {
    const apiUrls = [
      "https://mempool.space/api/v1/fees/recommended",
      "https://blockstream.info/api/fee-estimates",
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await response.json();

        if (apiUrl.includes("mempool.space")) {
          // mempool.space format
          if (data.fastestFee && data.halfHourFee && data.hourFee) {
            return {
              nextBlock: data.fastestFee,
              thirtyMin: data.halfHourFee,
              oneHour: data.hourFee,
              standard: data.economyFee || data.hourFee,
              unit: "Sats/vB",
              timestamp: Date.now(),
            };
          }
        } else {
          // blockstream.info format
          if (data["1"] && data["3"] && data["6"]) {
            return {
              nextBlock: Math.round(data["1"]),
              thirtyMin: Math.round(data["3"]),
              oneHour: Math.round(data["6"]),
              standard: Math.round(data["6"]),
              unit: "Sats/vB",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next API endpoint
        continue;
      }
    }
    
    return null;
  };

  // Fetch Solana priority fees
  const fetchSolanaGasData = async (): Promise<ChainGasData | null> => {
    const rpcUrls = [
      "https://api.mainnet-beta.solana.com",
      "https://solana-api.projectserum.com",
      "https://rpc.ankr.com/solana",
    ];
    
    for (const rpcUrl of rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getRecentPrioritizationFees",
            params: [],
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await response.json();
        
        if (data.result && data.result.length > 0) {
          const fees = data.result
            .map((f: any) => f.prioritizationFee)
            .filter((f: number) => f > 0);
          
          if (fees.length > 0) {
            const sortedFees = fees.sort((a: number, b: number) => a - b);
            const safe = Math.round(sortedFees[0] / 1000);
            const standard = Math.round(sortedFees[Math.floor(sortedFees.length / 2)] / 1000);
            const fast = Math.round(sortedFees[sortedFees.length - 1] / 1000);
            
            return {
              safe: safe > 0 ? safe : undefined,
              standard: standard > 0 ? standard : safe,
              fast: fast > standard ? fast : undefined,
              unit: "Microlamports",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next RPC endpoint
        continue;
      }
    }
    
    return null;
  };

  // Fetch Sui gas data
  const fetchSuiGasData = async (): Promise<ChainGasData | null> => {
    const rpcUrls = [
      "https://fullnode.mainnet.sui.io:443",
      "https://sui-mainnet-rpc.allthatnode.com",
    ];
    
    for (const rpcUrl of rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "suix_getReferenceGasPrice",
            params: [],
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await response.json();
        
        if (data.result) {
          const gasPrice = parseInt(data.result) / 1e9; // Convert MIST to readable unit
          if (gasPrice > 0) {
            return {
              standard: Math.round(gasPrice),
              unit: "MIST",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next RPC endpoint
        continue;
      }
    }
    
    return null;
  };

  // Fetch Aptos gas data
  const fetchAptosGasData = async (): Promise<ChainGasData | null> => {
    const apiUrls = [
      "https://fullnode.mainnet.aptoslabs.com/v1/estimate_gas_price",
      "https://aptos-mainnet.public.blastapi.io/v1/estimate_gas_price",
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await response.json();

        if (data.gas_estimate) {
          const gasPrice = parseInt(data.gas_estimate);
          if (gasPrice > 0) {
            return {
              standard: gasPrice,
              unit: "Gwei",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next API endpoint
        continue;
      }
    }
    
    return null;
  };

  // Fetch Tron gas data
  const fetchTronGasData = async (): Promise<ChainGasData | null> => {
    const apiUrls = [
      "https://api.trongrid.io/wallet/getenergyprices",
      "https://api.trongrid.io/v1/accounts/energy",
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await response.json();

        if (data.prices && data.prices.trx) {
          const gasPrice = parseInt(data.prices.trx);
          if (gasPrice > 0) {
            return {
              standard: gasPrice,
              unit: "SUN",
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        // Try next API endpoint
        continue;
      }
    }
    
    return null;
  };

  // Fetch chain-specific gas data
  const fetchChainGasData = async (chain: ChainId): Promise<ChainGasData | null> => {
    if (fetchQueueRef.current.has(chain)) return null;
    fetchQueueRef.current.add(chain);

    try {
      switch (chain) {
        case "btc":
          return await fetchBitcoinGasData();
        case "sol":
          return await fetchSolanaGasData();
        case "sui":
          return await fetchSuiGasData();
        case "aptos":
          return await fetchAptosGasData();
        case "tron":
          return await fetchTronGasData();
        default:
          return await fetchEVMGasData(chain);
      }
    } finally {
      fetchQueueRef.current.delete(chain);
    }
  };

  // Fetch all chain gas data (optimized with batching)
  const fetchAllGasData = async () => {
    try {
      setError(null);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);

      // Batch fetch all chains in parallel
      const results = await Promise.allSettled(
        Object.keys(CHAIN_CONFIGS).map((chainId) =>
          fetchChainGasData(chainId as ChainId)
        )
      );

      const newGasData: Record<ChainId, ChainGasData | null> = {
        eth: null,
        sol: null,
        arb: null,
        bsc: null,
        base: null,
        btc: null,
        sui: null,
        aptos: null,
        tron: null,
        op: null,
      };

      Object.keys(CHAIN_CONFIGS).forEach((chainId, index) => {
        const result = results[index];
        if (result.status === "fulfilled" && result.value && result.value.standard > 0) {
          newGasData[chainId as ChainId] = result.value;
        }
      });

      setGasData(newGasData);

      // Calculate L2 savings for L2 chains
      Object.entries(newGasData).forEach(([chainId, data]) => {
        if (data && CHAIN_CONFIGS[chainId as ChainId].isL2) {
          const config = CHAIN_CONFIGS[chainId as ChainId];
          const l1Data = newGasData[config.l1Chain!];
          if (l1Data && l1Data.standard > 0 && data.standard > 0) {
            const savings = ((l1Data.standard - data.standard) / l1Data.standard) * 100;
            data.l2Savings = Math.max(0, savings);
          }
        }
      });

      // Generate mock trend data if no real data available
      const generateMockTrendData = (currentValue: number): TrendData[] => {
        const data: TrendData[] = [];
        const now = new Date();
        const baseValue = currentValue > 0 ? currentValue : 20;
        
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          const hour = time.getHours();
          const minutes = time.getMinutes();
          const hourMultiplier = 0.7 + (Math.sin((hour - 6) * Math.PI / 12) + 1) * 0.3;
          const randomVariation = 0.9 + Math.random() * 0.2;
          const value = Math.round(baseValue * hourMultiplier * randomVariation);
          
          data.push({
            time: `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
            standard: Math.max(1, value),
          });
        }
        return data;
      };

      // Update trend data for active chain
      const activeData = newGasData[activeChain];
      if (activeData && activeData.standard > 0) {
        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        
        setTrendData((prev) => {
          const existing = prev[activeChain] || [];
          const updated = [...existing, { time: timeLabel, standard: activeData.standard }];
          return {
            ...prev,
            [activeChain]: updated.slice(-144),
          };
        });
      } else {
        // Generate mock data if no real data available
        setTrendData((prev) => {
          if (!prev[activeChain] || prev[activeChain].length === 0) {
            return {
              ...prev,
              [activeChain]: generateMockTrendData(activeData?.standard || 0),
            };
          }
          return prev;
        });
      }
    } catch (err) {
      setError("获取 Gas 数据失败");
      console.error("Error fetching gas data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch token prices
  const fetchTokenPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,binancecoin,bitcoin,sui,aptos,tron&vs_currencies=usd"
      );
      const data = await response.json();
      
      setTokenPrices({
        eth: data.ethereum?.usd || 0,
        sol: data.solana?.usd || 0,
        bnb: data.binancecoin?.usd || 0,
        btc: data.bitcoin?.usd || 0,
        sui: data.sui?.usd || 0,
        apt: data.aptos?.usd || 0,
        trx: data.tron?.usd || 0,
      });
    } catch (err) {
      console.error("Error fetching token prices:", err);
    }
  };

  // Calculate transaction cost
  const calculateCost = (chain: ChainId, gasLimit: number, gasPrice: number) => {
    const config = CHAIN_CONFIGS[chain];
    let tokenPrice = 0;
    
    if (chain === "eth" || chain === "base" || chain === "op") tokenPrice = tokenPrices.eth;
    else if (chain === "sol") tokenPrice = tokenPrices.sol;
    else if (chain === "bsc" || chain === "arb") tokenPrice = tokenPrices.bnb;
    else if (chain === "btc") tokenPrice = tokenPrices.btc;
    else if (chain === "sui") tokenPrice = tokenPrices.sui;
    else if (chain === "aptos") tokenPrice = tokenPrices.apt;
    else if (chain === "tron") tokenPrice = tokenPrices.trx;

    // Convert gas price to native token amount
    let nativeAmount = 0;
    if (chain === "sol") {
      nativeAmount = (gasLimit * gasPrice) / 1e9;
    } else if (chain === "btc") {
      // Bitcoin: sats/vB * vBytes / 1e8 = BTC
      nativeAmount = (gasLimit * gasPrice) / 1e8;
    } else {
      // EVM chains: Gwei * Gas / 1e9 = ETH
      nativeAmount = (gasLimit * gasPrice) / 1e9;
    }

    const usdCost = nativeAmount * tokenPrice;
    return { native: nativeAmount, usd: usdCost };
  };

  // Number ticker with pulse animation (only animates for non-zero values)
  const NumberTicker = ({ 
    value, 
    decimals = 0, 
    prefix = "", 
    suffix = "",
    chain,
    showSkeleton = false,
  }: { 
    value: number; 
    decimals?: number; 
    prefix?: string; 
    suffix?: string;
    chain?: ChainId;
    showSkeleton?: boolean;
  }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
      // Only animate if value is non-zero and different from current
      if (value > 0 && Math.abs(displayValue - value) > 0.01) {
        setIsAnimating(true);
        const startValue = displayValue > 0 ? displayValue : value;
        const endValue = value;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = startValue + (endValue - startValue) * easeOut;
          
          setDisplayValue(current);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      } else if (value === 0 && displayValue === 0) {
        setDisplayValue(0);
      }
    }, [value]);

    if (showSkeleton || (value === 0 && displayValue === 0)) {
      return <SkeletonLoader />;
    }

    return (
      <span 
        className={`inline-block transition-all duration-300 ${
          pulse && chain === activeChain && value > 0 ? "scale-110 text-amber-500 dark:text-amber-400" : "scale-100"
        } ${isAnimating ? "scale-105" : ""}`}
      >
        {prefix}
        {displayValue.toFixed(decimals)}
        {suffix}
      </span>
    );
  };

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      await fetchAllGasData();
      await fetchTokenPrices();
      setRefreshProgress(0); // Reset progress after fetch
    };

    fetchData();

    // Set up polling every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 10000);

    // Set up refresh progress indicator (syncs with 10s cycle)
    progressIntervalRef.current = setInterval(() => {
      setRefreshProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / 100); // Increment by 1% every 100ms = 10s total
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Reset progress when it reaches 100
  useEffect(() => {
    if (refreshProgress >= 100) {
      setRefreshProgress(0);
    }
  }, [refreshProgress]);

  const config = CHAIN_CONFIGS[activeChain];
  const currentGasData = gasData[activeChain];
  const currentTrendData = trendData[activeChain] || [];

  // Get glow color based on gas level
  const getGlowColor = (gwei: number) => {
    if (gwei < 20) return "from-green-400/30 to-green-600/10";
    if (gwei < 50) return config.color.glow;
    return "from-red-400/30 to-red-600/10";
  };

  const getTokenPrice = () => {
    if (activeChain === "eth" || activeChain === "base" || activeChain === "op") return tokenPrices.eth;
    if (activeChain === "sol") return tokenPrices.sol;
    if (activeChain === "bsc" || activeChain === "arb") return tokenPrices.bnb;
    if (activeChain === "btc") return tokenPrices.btc;
    if (activeChain === "sui") return tokenPrices.sui;
    if (activeChain === "aptos") return tokenPrices.apt;
    return tokenPrices.trx;
  };

  // Get RGB values for dynamic gradient
  const getRGBValues = () => {
    return config.color.rgb.split(", ");
  };

  if (loading && !currentGasData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400 font-serif text-lg">正在加载 Gas 数据...</p>
          </div>
        </div>
      </div>
    );
  }

  const rgb = getRGBValues();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      {/* Dynamic Mesh Gradient based on active chain */}
      <div 
        className="absolute inset-0 opacity-30 dark:opacity-15 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(at 20% 30%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25) 0px, transparent 50%),
            radial-gradient(at 80% 70%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12) 0px, transparent 50%)
          `,
        }}
      />

      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03] z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />

      <section ref={sectionRef} className="relative z-10">
        <ParallaxBackground sectionRef={sectionRef} parallaxSpeed={0.15} />

        {/* Header */}
        <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50 pt-6 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Link
              href="/tools"
              className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 font-sans"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回工具列表
            </Link>
            <h1 className={`font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r ${config.color.gradient} bg-clip-text text-transparent tracking-tight mb-2`}>
              Network Gas Intelligence
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-sans">
              多链 Gas 费用实时追踪与智能分析
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Chain Tabs - Scrollable on mobile */}
          <Tabs value={activeChain} onValueChange={(value) => setActiveChain(value as ChainId)} className="mb-6">
            <div className="overflow-x-auto -mx-4 px-4">
              <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-xl p-1 h-auto min-w-max">
                {Object.values(CHAIN_CONFIGS).map((chain) => (
                  <TabsTrigger
                    key={chain.id}
                    value={chain.id}
                    className={`${
                      chain.id === activeChain ? `bg-gradient-to-r ${chain.color.gradient} text-white` : "text-slate-600 dark:text-slate-400"
                    } transition-all duration-300 font-sans px-4 py-2 rounded-lg text-sm whitespace-nowrap`}
                  >
                    {chain.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Card - Active Chain Gas Prices */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                {/* Dynamic Radial Glow */}
                <div className={`absolute -inset-4 bg-gradient-to-br ${getGlowColor(currentGasData?.standard || 0)} rounded-2xl blur-3xl opacity-50 transition-all duration-700`} />
                
                {/* Grain texture */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                }} />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${config.color.glow.replace("/30", "/20").replace("/10", "/15")} rounded-xl border ${
                        config.color.primary === "amber" ? "border-amber-400/30" : 
                        config.color.primary === "purple" ? "border-purple-400/30" : 
                        config.color.primary === "blue" ? "border-blue-400/30" : 
                        config.color.primary === "navy" ? "border-blue-600/30" :
                        config.color.primary === "orange" ? "border-orange-400/30" :
                        config.color.primary === "ocean" ? "border-cyan-400/30" :
                        config.color.primary === "indigo" ? "border-indigo-400/30" :
                        config.color.primary === "red" ? "border-red-400/30" :
                        "border-yellow-400/30"
                      }`}>
                        <Zap className={`h-6 w-6 ${
                          config.color.primary === "amber" ? "text-amber-600 dark:text-amber-400" :
                          config.color.primary === "purple" ? "text-purple-600 dark:text-purple-400" :
                          config.color.primary === "blue" ? "text-blue-600 dark:text-blue-400" :
                          config.color.primary === "navy" ? "text-blue-700 dark:text-blue-400" :
                          config.color.primary === "orange" ? "text-orange-600 dark:text-orange-400" :
                          config.color.primary === "ocean" ? "text-cyan-600 dark:text-cyan-400" :
                          config.color.primary === "indigo" ? "text-indigo-600 dark:text-indigo-400" :
                          config.color.primary === "red" ? "text-red-600 dark:text-red-400" :
                          "text-yellow-600 dark:text-yellow-400"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-serif text-2xl text-slate-900 dark:text-white">
                            {config.name} Gas 价格
                          </CardTitle>
                          {config.isL2 && currentGasData?.l2Savings && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg font-sans">
                              <ArrowDown className="h-3 w-3 inline mr-1" />
                              {currentGasData.l2Savings.toFixed(0)}% 节省
                            </span>
                          )}
                        </div>
                        <CardDescription className="font-sans">
                          实时更新 · 每 10 秒刷新
                        </CardDescription>
                      </div>
                    </div>
                    {/* Refresh Progress Ring */}
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-slate-200 dark:text-slate-800"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - refreshProgress / 100)}`}
                          className={`transition-all duration-100 ${
                            config.color.primary === "amber" ? "text-amber-500" :
                            config.color.primary === "purple" ? "text-purple-500" :
                            config.color.primary === "blue" ? "text-blue-500" :
                            config.color.primary === "navy" ? "text-blue-600" :
                            config.color.primary === "orange" ? "text-orange-500" :
                            config.color.primary === "ocean" ? "text-cyan-500" :
                            config.color.primary === "indigo" ? "text-indigo-500" :
                            config.color.primary === "red" ? "text-red-500" :
                            "text-yellow-500"
                          }`}
                        />
                      </svg>
                      <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  {loading && !currentGasData ? (
                    <div className="flex items-center justify-center py-8">
                      <SkeletonLoader />
                    </div>
                  ) : currentGasData && currentGasData.standard > 0 ? (
                    // Bitcoin has special UI
                    activeChain === "btc" ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-sans uppercase tracking-wide">
                            Next Block
                          </div>
                          <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                            <NumberTicker 
                              value={currentGasData.nextBlock || 0} 
                              suffix={` ${currentGasData.unit}`} 
                              chain={activeChain}
                              showSkeleton={!currentGasData.nextBlock || currentGasData.nextBlock === 0}
                            />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/30 backdrop-blur-sm rounded-xl p-4 border-2 border-orange-400/30 dark:border-orange-600/30 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all duration-300">
                          <div className="text-xs text-orange-700 dark:text-orange-400 mb-2 font-sans uppercase tracking-wide font-bold">
                            30 Min
                          </div>
                          <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                            <NumberTicker 
                              value={currentGasData.thirtyMin || 0} 
                              suffix={` ${currentGasData.unit}`} 
                              chain={activeChain}
                              showSkeleton={!currentGasData.thirtyMin || currentGasData.thirtyMin === 0}
                            />
                          </div>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-sans uppercase tracking-wide">
                            1 Hour
                          </div>
                          <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                            <NumberTicker 
                              value={currentGasData.oneHour || 0} 
                              suffix={` ${currentGasData.unit}`} 
                              chain={activeChain}
                              showSkeleton={!currentGasData.oneHour || currentGasData.oneHour === 0}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`grid ${currentGasData.safe && currentGasData.fast ? "grid-cols-3" : "grid-cols-1"} gap-4`}>
                        {currentGasData.safe && (
                          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-sans uppercase tracking-wide">
                              Safe
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                              <NumberTicker 
                                value={currentGasData.safe} 
                                suffix={` ${currentGasData.unit}`} 
                                chain={activeChain}
                                showSkeleton={currentGasData.safe === 0}
                              />
                            </div>
                          </div>
                        )}
                        <div className={`${currentGasData.safe && currentGasData.fast ? "" : "max-w-md mx-auto"} bg-gradient-to-br ${config.color.glow.replace("/30", "/20").replace("/10", "/15")} backdrop-blur-sm rounded-xl p-4 border-2 ${
                          config.color.primary === "amber" ? "border-amber-400/30 dark:border-amber-600/30" :
                          config.color.primary === "purple" ? "border-purple-400/30 dark:border-purple-600/30" :
                          config.color.primary === "blue" ? "border-blue-400/30 dark:border-blue-600/30" :
                          config.color.primary === "navy" ? "border-blue-600/30 dark:border-blue-700/30" :
                          config.color.primary === "orange" ? "border-orange-400/30 dark:border-orange-600/30" :
                          config.color.primary === "ocean" ? "border-cyan-400/30 dark:border-cyan-600/30" :
                          config.color.primary === "indigo" ? "border-indigo-400/30 dark:border-indigo-600/30" :
                          config.color.primary === "red" ? "border-red-400/30 dark:border-red-600/30" :
                          "border-yellow-400/30 dark:border-yellow-600/30"
                        } hover:border-opacity-50 transition-all duration-300`}>
                          <div className={`text-xs mb-2 font-sans uppercase tracking-wide font-bold ${
                            config.color.primary === "amber" ? "text-amber-700 dark:text-amber-400" :
                            config.color.primary === "purple" ? "text-purple-700 dark:text-purple-400" :
                            config.color.primary === "blue" ? "text-blue-700 dark:text-blue-400" :
                            config.color.primary === "navy" ? "text-blue-800 dark:text-blue-400" :
                            config.color.primary === "orange" ? "text-orange-700 dark:text-orange-400" :
                            config.color.primary === "ocean" ? "text-cyan-700 dark:text-cyan-400" :
                            config.color.primary === "indigo" ? "text-indigo-700 dark:text-indigo-400" :
                            config.color.primary === "red" ? "text-red-700 dark:text-red-400" :
                            "text-yellow-700 dark:text-yellow-400"
                          }`}>
                            Standard
                          </div>
                          <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                            <NumberTicker 
                              value={currentGasData.standard} 
                              suffix={` ${currentGasData.unit}`} 
                              chain={activeChain}
                              showSkeleton={currentGasData.standard === 0}
                            />
                          </div>
                        </div>
                        {currentGasData.fast && (
                          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-sans uppercase tracking-wide">
                              Fast
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                              <NumberTicker 
                                value={currentGasData.fast} 
                                suffix={` ${currentGasData.unit}`} 
                                chain={activeChain}
                                showSkeleton={currentGasData.fast === 0}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-400 dark:text-slate-500 font-sans mb-2">
                        数据暂时不可用
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-600 font-sans">
                        正在尝试重新获取...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 24h Trend Chart */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-slate-900 dark:text-white">
                    24 小时趋势
                  </CardTitle>
                  <CardDescription className="font-sans">
                    {config.name} Standard Gas 价格变化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={currentTrendData}>
                        <defs>
                          <linearGradient id={`colorGradient-${activeChain}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={
                              config.color.primary === "amber" ? "#F59E0B" :
                              config.color.primary === "purple" ? "#A855F7" :
                              config.color.primary === "blue" ? "#3B82F6" :
                              config.color.primary === "navy" ? "#0052CC" :
                              config.color.primary === "orange" ? "#F97316" :
                              config.color.primary === "ocean" ? "#06B6D4" :
                              config.color.primary === "indigo" ? "#6366F1" :
                              config.color.primary === "red" ? "#EF4444" :
                              "#EAB308"
                            } stopOpacity={0.8} />
                            <stop offset="95%" stopColor={
                              config.color.primary === "amber" ? "#F59E0B" :
                              config.color.primary === "purple" ? "#A855F7" :
                              config.color.primary === "blue" ? "#3B82F6" :
                              config.color.primary === "navy" ? "#0052CC" :
                              config.color.primary === "orange" ? "#F97316" :
                              config.color.primary === "ocean" ? "#06B6D4" :
                              config.color.primary === "indigo" ? "#6366F1" :
                              config.color.primary === "red" ? "#EF4444" :
                              "#EAB308"
                            } stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          stroke="#94a3b8"
                          fontSize={12}
                          interval={0}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          fontSize={12}
                          label={{ value: currentGasData?.unit || 'Gas', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            fontFamily: 'var(--font-inter)',
                          }}
                          formatter={(value: number | undefined) => value !== undefined ? [`${value} ${currentGasData?.unit || ''}`, 'Standard'] : ['', 'Standard']}
                        />
                        <Area
                          type="monotone"
                          dataKey="standard"
                          stroke={
                            config.color.primary === "amber" ? "#F59E0B" :
                            config.color.primary === "purple" ? "#A855F7" :
                            config.color.primary === "blue" ? "#3B82F6" :
                            config.color.primary === "navy" ? "#0052CC" :
                            config.color.primary === "orange" ? "#F97316" :
                            config.color.primary === "ocean" ? "#06B6D4" :
                            config.color.primary === "indigo" ? "#6366F1" :
                            config.color.primary === "red" ? "#EF4444" :
                            "#EAB308"
                          }
                          strokeWidth={2}
                          fill={`url(#colorGradient-${activeChain})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 font-sans">
                      数据加载中...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Transaction Costs & Other Chains */}
            <div className="space-y-6">
              {/* Transaction Costs */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-slate-900 dark:text-white">
                    交易成本估算
                  </CardTitle>
                  <CardDescription className="font-sans">
                    基于当前 Standard Gas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentGasData && Object.entries(config.gasLimits).map(([key, gasLimit]) => {
                    const txNames: Record<string, string> = {
                      transfer: "标准转账",
                      swap: "DEX 交易",
                      nft: "NFT 交互",
                    };
                    const cost = calculateCost(activeChain, gasLimit, currentGasData.standard);
                    return (
                      <div
                        key={key}
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans font-medium text-slate-900 dark:text-white">
                            {txNames[key]}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                            {gasLimit.toLocaleString()} {activeChain === "btc" ? "vB" : "Gas"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
                            <NumberTicker value={cost.native} decimals={6} suffix={` ${config.symbol}`} />
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-sans">
                            ≈ $<NumberTicker value={cost.usd} decimals={2} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Token Price */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-slate-900 dark:text-white">
                    {config.symbol} 价格
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white font-serif">
                    $<NumberTicker value={getTokenPrice()} decimals={2} />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    实时更新
                  </div>
                </CardContent>
              </Card>

              {/* Other Chains Live Pulse */}
              <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-slate-900 dark:text-white">
                    其他网络
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.values(CHAIN_CONFIGS)
                    .filter((chain) => chain.id !== activeChain)
                    .map((chain) => {
                      const chainData = gasData[chain.id];
                      return (
                        <div
                          key={chain.id}
                          className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300 cursor-pointer"
                          onClick={() => setActiveChain(chain.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                chainData ? "bg-green-500 animate-pulse" : "bg-slate-400"
                              }`} />
                              <span className="font-sans font-medium text-slate-900 dark:text-white">
                                {chain.name}
                              </span>
                              {chain.isL2 && chainData?.l2Savings && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold font-sans">
                                  -{chainData.l2Savings.toFixed(0)}%
                                </span>
                              )}
                            </div>
                            {chainData ? (
                              <span className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                                {chainData.standard} {chainData.unit}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-sans">--</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
