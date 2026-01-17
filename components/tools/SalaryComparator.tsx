"use client";

import { useState, useMemo } from "react";
import { DollarSign, Calendar, Clock, TrendingUp, Award, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

interface Plan {
  id: string;
  name: string;
  monthlySalary: number;
  monthsPerYear: number;
  color: string;
  gradientId: string;
}

interface PlanResult {
  plan: Plan;
  yearly: number;
  monthly: number;
  daily: number;
  hourly: number;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "plan-a",
    name: "方案 A",
    monthlySalary: 15000,
    monthsPerYear: 13,
    color: "#3b82f6", // blue-500
    gradientId: "gradientA",
  },
  {
    id: "plan-b",
    name: "方案 B",
    monthlySalary: 18000,
    monthsPerYear: 12,
    color: "#10b981", // emerald-500
    gradientId: "gradientB",
  },
  {
    id: "plan-c",
    name: "方案 C",
    monthlySalary: 20000,
    monthsPerYear: 14,
    color: "#f59e0b", // amber-500
    gradientId: "gradientC",
  },
];

export function SalaryComparator() {
  // Global Settings
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState(21.75);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);

  // Plans State
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);

  // Update plan
  const updatePlan = (planId: string, field: "monthlySalary" | "monthsPerYear", value: number) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.id === planId ? { ...plan, [field]: value } : plan))
    );
  };

  // Calculate results for each plan
  const results = useMemo<PlanResult[]>(() => {
    return plans.map((plan) => {
      const monthly = plan.monthlySalary || 0;
      const yearly = monthly * plan.monthsPerYear;
      const daily = monthly / workingDaysPerMonth;
      const hourly = daily / workingHoursPerDay;

      return {
        plan,
        yearly: Math.round(yearly),
        monthly: Math.round(monthly),
        daily: Math.round(daily),
        hourly: Math.round(hourly),
      };
    });
  }, [plans, workingDaysPerMonth, workingHoursPerDay]);

  // Find winner (highest yearly)
  const winner = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((max, result) =>
      result.yearly > max.yearly ? result : max
    );
  }, [results]);

  // Chart data
  const chartData = useMemo(() => {
    return results.map((result) => ({
      name: result.plan.name,
      "年收入": result.yearly,
    }));
  }, [results]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            全局设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="days-per-month" className="text-xs text-slate-500">
                每月工作天数
              </Label>
              <Input
                id="days-per-month"
                type="number"
                value={workingDaysPerMonth}
                onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 21.75)}
                step={0.25}
                min={1}
                max={31}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hours-per-day" className="text-xs text-slate-500">
                每天工作小时数
              </Label>
              <Input
                id="hours-per-day"
                type="number"
                value={workingHoursPerDay}
                onChange={(e) => setWorkingHoursPerDay(Number(e.target.value) || 8)}
                step={0.5}
                min={1}
                max={24}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              winner?.plan.id === plan.id
                ? "border-2 border-yellow-400 dark:border-yellow-500 shadow-lg"
                : ""
            }`}
          >
            {winner?.plan.id === plan.id && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-yellow-400 text-black font-bold px-3 py-1 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  最优方案
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold" style={{ color: plan.color }}>
                {plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`${plan.id}-salary`} className="text-sm">
                  月薪 (CNY)
                </Label>
                <Input
                  id={`${plan.id}-salary`}
                  type="number"
                  value={plan.monthlySalary || ""}
                  onChange={(e) =>
                    updatePlan(plan.id, "monthlySalary", Number(e.target.value) || 0)
                  }
                  min={0}
                  step={1000}
                  className="mt-1 text-lg font-semibold"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor={`${plan.id}-months`} className="text-sm">
                  年终奖月数
                </Label>
                <Input
                  id={`${plan.id}-months`}
                  type="number"
                  value={plan.monthsPerYear || ""}
                  onChange={(e) =>
                    updatePlan(plan.id, "monthsPerYear", Number(e.target.value) || 12)
                  }
                  min={0}
                  max={24}
                  step={0.5}
                  className="mt-1"
                  placeholder="12"
                />
                <p className="text-xs text-slate-500 mt-1">
                  例如：12 = 无年终奖，13 = 13薪，14 = 14薪
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualization Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            年收入对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="gradientA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradientB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradientC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 14, fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(1)}万`}
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
                  }}
                />
                <Legend />
                <Bar dataKey="年收入" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const plan = plans[index];
                    return <Cell key={`cell-${index}`} fill={`url(#${plan.gradientId})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            详细对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    方案
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    年收入
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    月收入
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 inline mr-1" />
                    日收入
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 inline mr-1" />
                    时收入
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={result.plan.id}
                    className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                      winner?.plan.id === result.plan.id
                        ? "bg-yellow-50 dark:bg-yellow-900/10"
                        : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: result.plan.color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {result.plan.name}
                        </span>
                        {winner?.plan.id === result.plan.id && (
                          <Badge className="bg-yellow-400 text-black text-xs px-2 py-0">
                            <Award className="w-3 h-3 mr-1" />
                            最优
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">
                        {formatCurrency(result.yearly)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrency(result.monthly)}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(result.daily)}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(result.hourly)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          {results.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">最高年收入</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(Math.max(...results.map((r) => r.yearly)))}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">最低年收入</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(Math.min(...results.map((r) => r.yearly)))}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">年收入差距</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(
                      Math.max(...results.map((r) => r.yearly)) -
                        Math.min(...results.map((r) => r.yearly))
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

