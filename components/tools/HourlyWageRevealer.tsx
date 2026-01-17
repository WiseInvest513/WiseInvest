"use client";

import { useState, useMemo } from "react";
import { DollarSign, Calendar, Clock, TrendingUp, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Scenario {
  id: string;
  name: string;
  monthlySalary: number;
  monthsPerYear: number;
}

interface ScenarioResult {
  scenario: Scenario;
  annual: number;
  monthly: number;
  daily: number;
  hourly: number;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { id: "scenario-1", name: "场景 1", monthlySalary: 5000, monthsPerYear: 12 },
  { id: "scenario-2", name: "场景 2", monthlySalary: 10000, monthsPerYear: 12 },
  { id: "scenario-3", name: "场景 3", monthlySalary: 20000, monthsPerYear: 12 },
  { id: "scenario-4", name: "场景 4", monthlySalary: 50000, monthsPerYear: 12 },
  { id: "scenario-5", name: "场景 5", monthlySalary: 100000, monthsPerYear: 12 },
];

export function HourlyWageRevealer() {
  // Global Settings
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState(21.75);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(8);

  // Scenarios State
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  // Update scenario
  const updateScenario = (
    scenarioId: string,
    field: "monthlySalary" | "monthsPerYear",
    value: number
  ) => {
    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.id === scenarioId ? { ...scenario, [field]: value } : scenario
      )
    );
  };

  // Calculate results for each scenario
  const results = useMemo<ScenarioResult[]>(() => {
    return scenarios.map((scenario) => {
      const monthly = scenario.monthlySalary || 0;
      const annual = monthly * scenario.monthsPerYear;
      const daily = monthly / workingDaysPerMonth;
      const hourly = daily / workingHoursPerDay;

      return {
        scenario,
        annual: Math.round(annual),
        monthly: Math.round(monthly),
        daily: Math.round(daily),
        hourly: Math.round(hourly),
      };
    });
  }, [scenarios, workingDaysPerMonth, workingHoursPerDay]);

  // Chart data for hourly wage visualization
  const chartData = useMemo(() => {
    return results.map((result, index) => ({
      name: result.scenario.name,
      "时薪": result.hourly,
      index: index + 1,
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
      {/* Settings Bar */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            工作参数设置
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

      {/* Input Grid - 5 Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-300">
                {scenario.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor={`${scenario.id}-salary`} className="text-xs">
                  月薪 (CNY)
                </Label>
                <Input
                  id={`${scenario.id}-salary`}
                  type="number"
                  value={scenario.monthlySalary || ""}
                  onChange={(e) =>
                    updateScenario(scenario.id, "monthlySalary", Number(e.target.value) || 0)
                  }
                  min={0}
                  step={1000}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor={`${scenario.id}-months`} className="text-xs">
                  年终奖月数
                </Label>
                <Input
                  id={`${scenario.id}-months`}
                  type="number"
                  value={scenario.monthsPerYear || ""}
                  onChange={(e) =>
                    updateScenario(scenario.id, "monthsPerYear", Number(e.target.value) || 12)
                  }
                  min={0}
                  max={24}
                  step={0.5}
                  className="mt-1"
                  placeholder="12"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualization Chart - Hourly Wage Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            时薪对比曲线
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="gradientHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 14, fontWeight: 600 }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `¥${value.toLocaleString()}`}
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
                <Area
                  type="monotone"
                  dataKey="时薪"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#gradientHourly)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* The Truth Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            时薪真相表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">场景</TableHead>
                <TableHead className="text-right font-semibold">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  月薪
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  年收入
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <Clock className="w-4 h-4 inline mr-1" />
                  日收入
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <Clock className="w-4 h-4 inline mr-1" />
                  时薪
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.scenario.id}>
                  <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                    {result.scenario.name}
                  </TableCell>
                  <TableCell className="text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(result.monthly)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(result.annual)}
                  </TableCell>
                  <TableCell className="text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(result.daily)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {formatCurrency(result.hourly)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

