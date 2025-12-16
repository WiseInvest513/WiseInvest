'use client'

import { useState, useEffect, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface CalculatorResult {
  totalWealth: number
  totalPrincipal: number
  totalInterest: number
  yearsToGrow: number
}

export function InterestCalculator() {
  const [initialPrincipal, setInitialPrincipal] = useState(10000)
  const [monthlyContribution, setMonthlyContribution] = useState(1000)
  const [yearsToGrow, setYearsToGrow] = useState(20)
  const [interestRate, setInterestRate] = useState(10)
  const [animatedTotal, setAnimatedTotal] = useState(0)

  // 计算复利
  const result = useMemo<CalculatorResult>(() => {
    if (yearsToGrow <= 0) {
      return {
        totalWealth: initialPrincipal,
        totalPrincipal: initialPrincipal,
        totalInterest: 0,
        yearsToGrow: 0,
      }
    }

    const monthlyRate = interestRate / 100 / 12
    const months = yearsToGrow * 12

    // 初始本金复利
    const principalFutureValue = initialPrincipal * Math.pow(1 + interestRate / 100, yearsToGrow)

    // 每月定投的未来价值（年金终值公式）
    let monthlyFutureValue = 0
    if (monthlyRate > 0) {
      monthlyFutureValue =
        monthlyContribution *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    } else {
      monthlyFutureValue = monthlyContribution * months
    }

    const totalWealth = principalFutureValue + monthlyFutureValue
    const totalPrincipal = initialPrincipal + monthlyContribution * months
    const totalInterest = totalWealth - totalPrincipal

    return {
      totalWealth,
      totalPrincipal,
      totalInterest,
      yearsToGrow,
    }
  }, [initialPrincipal, monthlyContribution, yearsToGrow, interestRate])

  // 动画效果
  useEffect(() => {
    const duration = 1000
    const steps = 60
    const stepValue = result.totalWealth / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      if (currentStep <= steps) {
        setAnimatedTotal(stepValue * currentStep)
      } else {
        setAnimatedTotal(result.totalWealth)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [result.totalWealth])

  return (
    <div className="space-y-8">
      {/* 输入区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 左侧：输入控件 */}
        <div className="space-y-6">
          {/* 初始本金 */}
          <div className="space-y-3">
            <Label htmlFor="principal">初始本金</Label>
            <div className="flex items-center gap-4">
              <Input
                id="principal"
                type="number"
                value={initialPrincipal}
                onChange={(e) => setInitialPrincipal(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">元</span>
            </div>
          </div>

          {/* 每月定投 */}
          <div className="space-y-3">
            <Label htmlFor="monthly">每月定投</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  id="monthly"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">元</span>
              </div>
              <Slider
                value={[monthlyContribution]}
                onValueChange={(value) => setMonthlyContribution(value[0])}
                min={0}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>
          </div>

          {/* 投资年限 */}
          <div className="space-y-3">
            <Label htmlFor="years">投资年限</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  id="years"
                  type="number"
                  value={yearsToGrow}
                  onChange={(e) => setYearsToGrow(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">年</span>
              </div>
              <Slider
                value={[yearsToGrow]}
                onValueChange={(value) => setYearsToGrow(value[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* 预期年化收益率 */}
          <div className="space-y-3">
            <Label htmlFor="rate">预期年化收益率</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  id="rate"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={0}
                max={30}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                标普500历史平均年化收益率约10%
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：结果显示 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-brand-accent">
                {formatCurrency(animatedTotal)}
              </CardTitle>
              <CardDescription>总资产</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {formatCurrency(result.totalPrincipal)}
                </CardTitle>
                <CardDescription>总投入本金</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-500">
                  {formatCurrency(result.totalInterest)}
                </CardTitle>
                <CardDescription>总收益</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="text-xs text-slate-500 dark:text-slate-500 text-right">
        注:计算结果仅供参考,实际收益会因市场波动而有所不同。复利计算基于固定年化收益率,未考虑通胀因素。
      </div>
    </div>
  )
}
