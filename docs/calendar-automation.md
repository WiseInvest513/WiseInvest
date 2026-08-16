# Wise 投资日历自动更新

网站日历的唯一运行时数据源是 `lib/calendar-events.json`。每周自动化不直接手改该文件，而是先生成一个严格的“周数据包”，再通过导入器完整替换目标周，避免重复、残留旧事件或写入不合法数据。

## 周数据包格式

```json
{
  "schemaVersion": 1,
  "timezone": "Asia/Shanghai",
  "generatedAt": "2026-08-22T18:20:00+08:00",
  "range": {
    "start": "2026-08-24",
    "end": "2026-08-30"
  },
  "events": [
    {
      "date": "2026-08-25",
      "time": "22:00",
      "title": "美国8月消费者信心指数",
      "category": "经济数据",
      "impact": "medium",
      "description": "关注预期分项、就业感受与通胀预期相对市场预期的变化"
    },
    {
      "date": "2026-08-26",
      "time": "盘后",
      "title": "英伟达（NVDA）财报",
      "category": "美股财报",
      "impact": "high",
      "description": "关注数据中心收入、毛利率、下一季度指引与供应约束"
    }
  ]
}
```

约束：

- `range.start` 必须是周一，`range.end` 必须是紧随其后的周日。
- `date` 以网站展示的北京时间日期为准；美股财报可用 `盘前` 或 `盘后`，其他事件使用北京时间 `HH:mm` 或 `全天`。
- `category` 只能是 `宏观`、`经济数据`、`美股财报`。
- `impact` 只能是 `high`、`medium`、`low`。
- `description` 只写投资者应该关注的变量，不写确定性的涨跌结论。
- 生成阶段可以保留研究来源与长文，但交给导入器的 JSON 只能包含上述字段，图片和制图说明一律删除。

## 本地命令

```bash
npm run calendar:validate
npm run calendar:import -- /tmp/wise-calendar-next-week.json
npm run calendar:import -- /tmp/wise-calendar-next-week.json --write
```

第一次导入不带 `--write`，只做预演。确认摘要中的区间、写入数和替换数合理后，再执行写入。导入器会：

1. 严格校验周数据包和现有数据。
2. 保留目标周以外的历史与未来事件。
3. 删除目标周旧数据，并用新数据完整替换。
4. 去重并按日期、时间和标题排序。
5. 以临时文件加重命名的方式原子写入。

## 自动化提交保护

周六自动化只有在以下条件全部满足时才允许推送：

1. 研究来源足以核验事件日期、时间和标题。
2. `calendar:import` 预演与正式写入均成功。
3. `calendar:validate`、`npx tsc --noEmit` 和 `npm run build` 全部通过。
4. Git 暂存区只包含 `lib/calendar-events.json`；若没有数据变化则不提交。
5. 推送前确认远端 `main` 没有领先本地；发生冲突或工作区存在其他未提交修改时停止，不自动覆盖。

失败时保留报告，不提交半成品，也不使用强制推送。
