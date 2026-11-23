---
title: 发布 self-loop v0.4.10 与 X32 四层 Agentic 工程栈
description: self-loop、System of Skills、Argus 与 Agent DAO 如何咬合为一套面向一人 AI 工作室的闭环工程系统。
pubDate: 2026-10-18
locale: zh
postSlug: introducing-self-loop-and-x32-stack
tags:
  - self-loop
  - 系统架构
  - agentic-stack
---

大多数 AI 开发者的主页像一排彼此无关的周末 Demo。X32 Studio 选择了相反的路径：每一个公开仓库都是同一套闭环系统的承重层，目标只有一个——把一名工程师从战略到交付的端到端射程放大一个数量级。

## 为什么是四层？

当你以一人公司（OPC）与直接负责人（DRI）的方式推进产品和研究时，瓶颈从来不只在写代码本身。如果多个 Skill 互相抢触发、深度研究每次换会话就失忆、架构决策缺少第一性原理锚点，局部提速很快就会被系统熵增吞掉。

**X32 Agentic 工程栈**把四个环节闭合成一条完整链路：

1. **L1 · `self-loop`（`v0.4.10`）— 自主交付引擎**：在隔离角色与独立 worktree 中分离 **Critic**、**Actor** 与 **Judge**。不再寄希望于单次对话里的自律，而是将目标规格与硬性工程约束转化为经独立验证的 Commit、自动化测试证据与只追加决策记录。
2. **L2 · `System of Skills` — 多 Skill 架构规范**：单个 Skill 的教程在十几个能力共存时就会失效。这份系统工程指南明确了互不重叠的触发边界、能力唯一归属以及分层交接契约。
3. **L3 · `Argus` — 持久知识树研究仪器**：打包为开箱即用的 Claude Code skill 与实时可视化仪表盘，每一轮深挖都向同一棵持久研究树追加来源、关系、未解问题与报告更新，让长期研究真正产生复利。
4. **L4 · `Agent DAO` — 第一性原理长文**：为整套工程栈提供理论锚点——**Agent 是模型之外的模型**。每当模型触及既有压缩边界，外部结构（harness、skills、持久记忆与验证闭环）就在其周围生长，并在后续被部分吸收回模型本体。

## 闭环如何运转

没有执行的理论会滑向空谈，没有理论锚点的执行则会沦为脆弱的 Prompt 胶水。在 X32 Studio 中，**Argus** 持续沉淀一线研究信号，**Agent DAO** 提炼跨周期的架构公理，**System of Skills** 保证能力组合不退化，**`self-loop`** 则把一切稳定交付为可验证的生产代码。

欢迎直接检视交付引擎仓库 [github.com/X32Studio/self-loop](https://github.com/X32Studio/self-loop)，或关注 [github.com/k-r33](https://github.com/k-r33) 获取持续更新。
