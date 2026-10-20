# 全站投票弹窗

主站后台 `/admin/popup` 控制启用、网站范围、投票文案和两个投票地址。公开配置接口为 `/api/public/popup`，仅提供活动配置，允许跨站匿名读取，不携带 Cookie。开发环境配置仅在主站进程内保存，不写生产数据库。

站点 ID：main、etf、chain、vip、ipo、crypto、sim、witness、hold。

每次完整进入或刷新页面自动显示一次；当前页面关闭后不定时打扰。右上角“为 Wise 投票”可随时重新打开。“加入群聊”手动打开原群聊（没有原组件的站点使用共享群聊）。两个弹窗互斥。管理、账户、登录等路由不自动弹出。配置服务不可用时不弹出，不回退旧推广。

共享客户端权威文件：`public/wise-popup.js`。按钮下方的注册教程链接在该文件统一维护。Shadow DOM 隔离样式，各站本地托管同一份脚本，活动内容从主站实时读取。

样式或注册教程修改后，在主站运行 `node scripts/sync-wise-popup.mjs` 同步相邻目录中的八个站点；运行 `node scripts/sync-wise-popup.mjs --check` 检查一致性。站点根目录可由 WISE_SITES_ROOT 指定。同步不会部署。

开发时先运行主站 3002 端口，再启动目标站；目标站读取 http://127.0.0.1:3002/api/public/popup。生产读取 https://www.wise-invest.org/api/public/popup。

上线顺序：先按项目正式数据库流程应用 `20261020000000_popup_campaign` migration，生成 Prisma client 并部署主站；验证公开配置接口和后台保存；随后部署其余各站。未部署主站接口时其他站会安全地不显示活动。不要将本地测试配置误当成已上线配置。
