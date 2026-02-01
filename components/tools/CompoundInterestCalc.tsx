"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toPng } from "html-to-image";
import { Download, Copy, CheckCircle2, Rocket, TrendingUp, DollarSign, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChartData {
  year: number;
  principal: number;
  interest: number;
}

export function CompoundInterestCalc() {
  const [principal, setPrincipal] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [annualRate, setAnnualRate] = useState(8);
  const [years, setYears] = useState(10);
  const shareRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate compound interest
  const calculations = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    let futureValue = principal;
    let totalContributed = principal;
    const chartData: ChartData[] = [{ year: 0, principal: principal, interest: 0 }];

    for (let month = 1; month <= totalMonths; month++) {
      // Add monthly contribution at the beginning of each month
      futureValue += monthlyContribution;
      totalContributed += monthlyContribution;

      // Apply compound interest at the end of each month
      futureValue *= 1 + monthlyRate;

      // Record yearly data
      if (month % 12 === 0) {
        const year = month / 12;
        const interestEarned = futureValue - totalContributed;
        chartData.push({
          year,
          principal: totalContributed,
          interest: interestEarned,
        });
      }
    }

    // Final calculation
    const interestEarned = futureValue - totalContributed;

    return {
      futureValue,
      totalContributed,
      interestEarned,
      chartData,
    };
  }, [principal, monthlyContribution, annualRate, years]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 根据数字长度计算合适的字体大小
  const getFontSize = (value: number) => {
    const formatted = formatCurrency(value);
    const length = formatted.length;
    
    // 根据字符长度返回合适的字体大小类，更激进的缩小策略
    if (length <= 8) return "text-3xl md:text-4xl";      // ¥100,000 以内
    if (length <= 10) return "text-2xl md:text-3xl";     // ¥1,000,000 以内
    if (length <= 12) return "text-xl md:text-2xl";      // ¥10,000,000 以内
    if (length <= 14) return "text-lg md:text-xl";       // ¥100,000,000 以内
    if (length <= 16) return "text-base md:text-lg";     // ¥1,000,000,000 以内
    return "text-sm md:text-base";                       // 更大的数字
  };

  // 计算财富倍数
  const wealthMultiplier = useMemo(() => {
    if (calculations.totalContributed > 0) {
      return (calculations.futureValue / calculations.totalContributed).toFixed(2);
    }
    return "1.00";
  }, [calculations]);


  // 生成图片预览
  const generateImagePreview = async () => {
    if (!shareRef.current) return null;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(shareRef.current, {
        backgroundColor: "#0a0a0a",
        quality: 1.0,
        pixelRatio: 2,
      });
      return dataUrl;
    } catch (error) {
      console.error("Failed to generate image:", error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };


  // 复制图片到剪贴板（对话框版本）
  const handleCopyImage = async () => {
    if (!imagePreview) return;

    try {
      // 将 base64 转换为 Blob
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      // 复制图片到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
      // 如果复制图片失败，尝试降级到复制图片 URL
      try {
        await navigator.clipboard.writeText(imagePreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Failed to copy image URL:", fallbackError);
      }
    }
  };

  // 下载图片
  const handleDownloadImage = async () => {
    if (!imagePreview) return;

    try {
      const link = document.createElement("a");
      link.download = `复利计算-初始本金${principal}-每月定投${monthlyContribution}-年化${annualRate}%-${years}年.png`;
      link.href = imagePreview;
      link.click();
      setShowShareDialog(false);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  // 打开分享对话框并生成预览
  const handleShare = async () => {
    setShowShareDialog(true);
    const preview = await generateImagePreview();
    if (preview) {
      setImagePreview(preview);
    }
  };

  // 自定义图表 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-amber-400 font-semibold mb-2">{`第 ${label} 年`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-slate-200 text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
          <p className="text-amber-400 font-semibold mt-2 pt-2 border-t border-amber-500/20">
            总计: {formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Layout: Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Visualization (7 cols) - 数据展示 */}
          <div ref={shareRef} className="lg:col-span-7 space-y-6">
            {/* Investment Parameters Summary - 在分享图片中显示 */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 shadow-xl">
              <h3 className="text-slate-300 font-semibold text-base mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                投资参数
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">初始本金</p>
                  <p className="text-amber-400 font-bold text-xl md:text-2xl">¥{principal.toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">每月定投</p>
                  <p className="text-amber-400 font-bold text-xl md:text-2xl">¥{monthlyContribution.toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">年化收益率</p>
                  <p className="text-amber-400 font-bold text-xl md:text-2xl">{annualRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">投资时长</p>
                  <p className="text-amber-400 font-bold text-xl md:text-2xl">{years}年</p>
                </div>
              </div>
            </div>

            {/* Wealth Multiplier Badge */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-amber-500/10">
              <Rocket className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-slate-300 text-base">财富倍数</p>
                <p className="text-amber-400 font-bold text-2xl md:text-3xl">
                  你的资金将增长 <span className="text-amber-300">{wealthMultiplier}</span> 倍！
                </p>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Future Value - Large Card */}
              <div className="md:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-amber-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-slate-300 text-base font-medium">未来价值</p>
                  </div>
                  <div className="h-16 flex items-center mb-1 overflow-hidden w-full min-w-0">
                    <p className={`text-amber-400 font-bold ${getFontSize(calculations.futureValue)} drop-shadow-[0_0_8px_rgba(255,159,10,0.5)] break-all leading-tight w-full min-w-0`} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                    {formatCurrency(calculations.futureValue)}
                  </p>
                  </div>
                  <p className="text-slate-400 text-sm">最终资产总额</p>
                </div>
              </div>

              {/* Total Contributed */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <p className="text-slate-300 text-base font-medium">总投入本金</p>
                </div>
                <div className="h-16 flex items-center mb-1 overflow-hidden w-full min-w-0">
                  <p className={`text-slate-100 font-bold ${getFontSize(calculations.totalContributed)} break-all leading-tight w-full min-w-0`} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                  {formatCurrency(calculations.totalContributed)}
                </p>
                </div>
                <p className="text-slate-400 text-sm">累计投入</p>
              </div>

              {/* Interest Earned */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-slate-300 text-base font-medium">复利收益</p>
                </div>
                <div className="h-16 flex items-center mb-1 overflow-hidden w-full min-w-0">
                  <p className={`text-amber-400 font-bold ${getFontSize(calculations.interestEarned)} break-all leading-tight w-full min-w-0`} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                  {formatCurrency(calculations.interestEarned)}
                </p>
                </div>
                <p className="text-slate-400 text-sm">纯收益</p>
              </div>
            </div>

            {/* Chart View - 只显示图表，不包含表格切换 */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-xl">
              <h3 className="text-slate-300 font-semibold text-base mb-4">收益趋势图</h3>
              <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={calculations.chartData}>
                      <defs>
                        <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9F0A" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#FF9F0A" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748B" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#64748B" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="year"
                        stroke="#64748b"
                        fontSize={14}
                        tickFormatter={(value) => `${value}年`}
                        tick={{ fill: "#cbd5e1", fontSize: 14 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={14}
                        tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                        tick={{ fill: "#cbd5e1", fontSize: 14 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ color: "#cbd5e1", fontSize: "14px" }}
                        iconType="circle"
                      />
                      <Area
                        type="monotone"
                        dataKey="principal"
                        stackId="1"
                        stroke="#64748B"
                        fill="url(#principalGradient)"
                        name="本金投入"
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        stackId="1"
                        stroke="#FF9F0A"
                        fill="url(#interestGradient)"
                        name="复利收益"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT COLUMN: Control Panel (5 cols) - 数据输入 */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* 年度表格 - 右上角，固定高度，可滚动 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 shadow-xl">
              <h3 className="text-slate-300 font-semibold text-base mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-400" />
                年度数据表
              </h3>
              
              {/* 固定高度的表格容器，支持滚动 */}
              <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-3 text-slate-400 font-semibold text-xs">年份</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-semibold text-xs">本金投入</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-semibold text-xs">复利收益</th>
                      <th className="text-right py-2 px-3 text-amber-400 font-semibold text-xs">总价值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.chartData.map((data, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2 px-3 text-slate-300 text-xs">{data.year}年</td>
                        <td className="py-2 px-3 text-right text-slate-400 text-xs">
                          {formatCurrency(data.principal)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400 text-xs">
                          {formatCurrency(data.interest)}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-400 font-semibold text-xs">
                          {formatCurrency(data.principal + data.interest)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Glassmorphism Card - 投资参数输入 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col">
              <h2 className="text-lg md:text-xl font-bold text-amber-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                投资参数
              </h2>

              <div className="space-y-3 flex-1">
                {/* Initial Principal */}
                <div className="space-y-1.5">
                  <Label htmlFor="principal" className="text-slate-300 text-base font-medium">
                    初始本金 (元)
                  </Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="bg-slate-800/70 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/20 h-12 text-xl md:text-2xl font-bold text-center"
                    placeholder="10000"
                  />
                </div>

                {/* Monthly Contribution */}
                <div className="space-y-1.5">
                  <Label htmlFor="monthly" className="text-slate-300 text-base font-medium">
                    每月定投 (元)
                  </Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="bg-slate-800/70 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/20 h-12 text-xl md:text-2xl font-bold text-center"
                    placeholder="1000"
                  />
                </div>

                {/* Annual Rate Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rate" className="text-slate-300 text-base font-medium">
                      年化收益率 (%)
                    </Label>
                    <span className="text-amber-400 font-bold text-lg md:text-xl">{annualRate.toFixed(1)}%</span>
                  </div>
                  <Slider
                    id="rate"
                    min={0}
                    max={30}
                    step={0.1}
                    value={annualRate}
                    onValueChange={setAnnualRate}
                    className="slider-amber"
                    style={{
                      background: `linear-gradient(to right, #FF9F0A 0%, #FF9F0A ${((annualRate || 0) - 0) / (30 - 0) * 100}%, #334155 ${((annualRate || 0) - 0) / (30 - 0) * 100}%, #334155 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Years Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="years" className="text-slate-300 text-base font-medium">
                      投资时长 (年)
                    </Label>
                    <span className="text-amber-400 font-bold text-lg md:text-xl">{years}年</span>
                  </div>
                  <Slider
                    id="years"
                    min={1}
                    max={50}
                    step={1}
                    value={years}
                    onValueChange={setYears}
                    className="slider-amber"
                    style={{
                      background: `linear-gradient(to right, #FF9F0A 0%, #FF9F0A ${((years || 1) - 1) / (50 - 1) * 100}%, #334155 ${((years || 1) - 1) / (50 - 1) * 100}%, #334155 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1年</span>
                    <span>50年</span>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold py-6 text-lg shadow-lg shadow-amber-500/20 mt-6"
              >
                <Download className="mr-2 h-5 w-5" />
                分享我的暴富计划
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto [&>button]:text-slate-300 [&>button]:hover:text-white [&>button]:hover:bg-slate-800/80 [&>button]:rounded-md [&>button]:p-1">
          <DialogHeader>
            <DialogTitle className="text-amber-400">分享我的暴富计划</DialogTitle>
            <DialogDescription className="text-slate-400">
              预览图片后，选择复制或下载
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* 图片预览区域 - 简化结构，直接显示图片 */}
            {isGenerating ? (
              <div className="flex items-center justify-center h-48 bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-400">正在生成预览...</p>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="w-full flex items-center justify-center bg-transparent">
                <img
                  src={imagePreview}
                  alt="复利计算预览"
                  className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">预览加载失败</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleCopyImage}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                disabled={!imagePreview || isGenerating}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    复制图片
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadImage}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                disabled={!imagePreview || isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                下载图片
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
