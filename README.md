# Issue Tracker - 问题单管理看板

## 项目简介
团队内部使用的问题单进度管理系统，纯前端应用，数据通过Excel导入。

## 项目路径
`c:\code\aiprojects\issue-tracker`

## 启动方式
```bash
cd c:\code\aiprojects\issue-tracker
npm install   # 首次运行或依赖更新时
npm run dev   # 启动开发服务器 (http://localhost:5173)
npm run build # 构建生产版本
```

## 核心功能
1. Excel数据导入（支持昨日/今日数据对比）
2. 团队总览视图（紧急问题看板、遗留跟踪看板）
3. 解单排行榜（按解决数量排名）
4. 数据对比视图
5. 个人详情查看
6. 导出PNG/PDF

## 配置文件
- `src/config/field-mapping.json` - 字段映射、严重程度、排除人员等配置

## 技术栈
React + TypeScript + Vite + Tailwind CSS + xlsx + Recharts

## 相关文档
- 设计文档: `c:\code\aiprojects\docs\superpowers\specs\2026-04-26-issue-tracker-design.md`
- 原型: `c:\code\aiprojects\docs\superpowers\proto\high-fidelity-prototype.html`