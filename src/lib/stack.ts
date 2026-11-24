import type { Locale } from "./content";

export type StackLayerId = "self-loop" | "skills-system" | "argus" | "agent-dao";

export type TelemetryReadout = {
  label: string;
  value: string;
  tone: "cyan" | "violet" | "ember" | "emerald";
};

export type StackLayer = {
  id: StackLayerId;
  code: string;
  name: string;
  badge: string;
  role: string;
  oneLiner: string;
  description: string;
  io: {
    input: string;
    output: string;
  };
  commandLabel: string;
  command: string;
  guarantees: string[];
  connections: {
    upstream: StackLayerId;
    downstream: StackLayerId;
    summary: string;
  };
  visual:
    | {
        type: "image";
        src: string;
        alt: string;
        caption: string;
      }
    | {
        type: "telemetry";
        title: string;
        readouts: TelemetryReadout[];
      };
  links: {
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
};

export type StackCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  busLabel: string;
  feedbackLabel: string;
  inputLabel: string;
  outputLabel: string;
  guaranteesLabel: string;
  compositionLabel: string;
  upstreamLabel: string;
  downstreamLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  allProjectsLabel: string;
  allProjectsHref: string;
};

const STACK_COPY: Record<Locale, StackCopy> = {
  en: {
    eyebrow: "X32 Agentic Stack · 4-Layer Architecture",
    title: "Four-layer closed-loop engineering stack",
    subtitle:
      "A composed engineering stack where first-principles theory governs skill topology, autonomous delivery ships verified code, and deep research feeds new purpose back into the loop.",
    busLabel: "Closed-loop telemetry bus",
    feedbackLabel: "L4 ↺ L1 feedback",
    inputLabel: "Input",
    outputLabel: "Output",
    guaranteesLabel: "Architectural guarantees",
    compositionLabel: "How it composes",
    upstreamLabel: "Upstream",
    downstreamLabel: "Downstream",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    copyFailedLabel: "Copy failed — select text",
    allProjectsLabel: "Inspect full catalog →",
    allProjectsHref: "/projects/",
  },
  zh: {
    eyebrow: "X32 Agentic 工程栈 · 四层架构",
    title: "四件仪器，一套闭环系统。",
    subtitle:
      "不是零散的 Demo 合集，而是互为支撑的 agentic 工程栈：第一性原理约束技能拓扑，自主交付引擎把目标变成经验证的代码，长程研究仪器再把新洞察回灌到下一轮循环。",
    busLabel: "闭环遥测总线",
    feedbackLabel: "L4 ↺ L1 回授",
    inputLabel: "输入契约",
    outputLabel: "输出产物",
    guaranteesLabel: "核心工程保障",
    compositionLabel: "栈内组合关系",
    upstreamLabel: "上游输入",
    downstreamLabel: "下游驱动",
    copyLabel: "复制",
    copiedLabel: "已复制",
    copyFailedLabel: "复制失败，请手动复制",
    allProjectsLabel: "查看完整项目档案 →",
    allProjectsHref: "/zh/projects/",
  },
};

const STACK_LAYERS: Record<Locale, StackLayer[]> = {
  en: [
    {
      id: "self-loop",
      code: "L1",
      name: "self-loop",
      badge: "v0.8.0 · DISPATCH + AGENT ORG",
      role: "Trustworthy Agent Coding Team Engine",
      oneLiner: "Turns a chaotic agent mob into a trustworthy Agent Coding Team via decoupled parallel dispatch, anti-rot scanning, SSOT gates, and cross-vendor judging.",
      description:
        "In the AI era, human attention is the only real bottleneck. self-loop v0.8.0 chains Generation (plans and contracts), Dispatch & Integration (arch-facts dependency graph, parallel Actor waves, and disjoint integration), and Adversarial Verification (Critics and cross-vendor Judge) behind two-loop anti-rot scanning, SSOT drift gates, premise exit-7 brakes, and exact-tree GitHub/AWS CI receipts.",
      io: {
        input: "Purpose (P-NNNN) + Chaotic Agent Swarm",
        output: "Trustworthy Agent Coding Team & Verified Commits",
      },
      commandLabel: "QUICK START DEMO (v0.8.0)",
      command: "git clone https://github.com/X32Studio/self-loop.git && cd self-loop && npm run demo",
      guarantees: [
        "Three chained engines: Generation + Dispatch & Integration (parallel Actor waves) + Cross-Vendor Adversarial Judging.",
        "Two-loop rhythm with bounded refactoring windows, anti-rot scanning, and SSOT authority doc drift gates.",
        "Zero npm dependencies; runs on Claude Code, Codex & Antigravity with live GitHub Actions & AWS CodeBuild gates.",
      ],
      connections: {
        upstream: "agent-dao",
        downstream: "skills-system",
        summary: "Operationalizes Agent DAO's external-harness thesis and invokes clean skill contracts from Layer 2.",
      },
      visual: {
        type: "telemetry",
        title: "THREE-ENGINE TOPOLOGY // v0.8.0",
        readouts: [
          { label: "DISPATCH", value: "arch-facts parallel waves", tone: "cyan" },
          { label: "ACTOR", value: "Decoupled wave commits", tone: "violet" },
          { label: "JUDGE", value: "Cross-vendor clean checkout", tone: "ember" },
          { label: "GATES", value: "SSOT + Anti-Rot + Live CI", tone: "emerald" },
        ],
      },
      links: {
        primary: { label: "GitHub · self-loop", href: "https://github.com/X32Studio/self-loop" },
        secondary: { label: "Read stack note", href: "/blog/introducing-self-loop-and-x32-stack/" },
      },
    },
    {
      id: "skills-system",
      code: "L2",
      name: "System of Skills",
      badge: "SPEC · TOPOLOGY",
      role: "Skill Architecture & Composition Spec",
      oneLiner: "Stops trigger collisions and keeps growing multi-skill agent libraries coherent.",
      description:
        "Covers the systems-engineering layer single-skill docs ignore: trigger boundary partitioning, capability ownership, conflict auditing, and lifecycle governance so adding the 20th skill strengthens the system instead of breaking the first 19.",
      io: {
        input: "Scattered Prompts, Tools & Overlapping Skills",
        output: "Non-Colliding Skill Graph & Routing Contracts",
      },
      commandLabel: "ARCHITECTURE CONTRACT",
      command: "skills/ -> trigger-boundaries + single-owner-capability -> deterministic dispatch",
      guarantees: [
        "Explicit trigger envelopes eliminate ambiguous routing between sibling skills.",
        "Clear inclusion test decides when a workflow warrants a new skill vs. extending an existing one.",
        "Bilingual EN/ZH authoring guide built directly from production agent deployments.",
      ],
      connections: {
        upstream: "self-loop",
        downstream: "argus",
        summary: "Structures the reusable skill primitives executed inside self-loop and packages instruments like Argus.",
      },
      visual: {
        type: "telemetry",
        title: "ROUTING INTEGRITY MATRIX // SPEC",
        readouts: [
          { label: "TRIGGERS", value: "Disjoint intent boundaries", tone: "cyan" },
          { label: "OWNERSHIP", value: "1 capability = 1 skill", tone: "violet" },
          { label: "COMPOSE", value: "Layered handoff contracts", tone: "emerald" },
          { label: "DRIFT", value: "Zero silent degradation", tone: "ember" },
        ],
      },
      links: {
        primary: { label: "GitHub · Skills Guide", href: "https://github.com/X32Studio/best-practice-for-skills-system" },
      },
    },
    {
      id: "argus",
      code: "L3",
      name: "Argus",
      badge: "TREE · INSTRUMENT",
      role: "Persistent Deep-Research Instrument",
      oneLiner: "Grows a compounding research tree from a messy field — round after round.",
      description:
        "Packaged as a single Claude Code skill with a live visual dashboard. Each pass appends cited sources, structured notes, relationship edges, open questions, and report updates onto the same persistent tree so long-range inquiries never restart from zero.",
      io: {
        input: "Broad Research Question + Unstructured Sources",
        output: "Persistent Knowledge Tree, Live Dashboard & Reports",
      },
      commandLabel: "SKILL INVOCATION",
      command: "/argus \"organizational intelligence & hybrid agent architectures\" --dashboard",
      guarantees: [
        "Persistent knowledge tree accumulates evidence across sessions instead of ephemeral chat threads.",
        "Tracks contradictions and open questions explicitly to guide the next deep-research pass.",
        "One window, one skill command: setup, dashboard launch, loop execution, and report synthesis.",
      ],
      connections: {
        upstream: "skills-system",
        downstream: "agent-dao",
        summary: "Built on Layer 2's skill design discipline; feeds verified field evidence back into Agent DAO and new self-loop missions.",
      },
      visual: {
        type: "image",
        src: "/assets/argus-dashboard.webp",
        alt: "Argus live research tree dashboard interface",
        caption: "LIVE INSTRUMENT // Persistent research tree & multi-pass telemetry view",
      },
      links: {
        primary: { label: "GitHub · Argus", href: "https://github.com/X32Studio/Argus" },
        secondary: { label: "How Argus works", href: "/blog/how-argus-grows-a-research-tree/" },
      },
    },
    {
      id: "agent-dao",
      code: "L4",
      name: "Agent DAO",
      badge: "THESIS · PDF",
      role: "First-Principles Monograph",
      oneLiner: "The agent is the model outside the model — why agents evolve instead of vanishing.",
      description:
        "A bilingual working monograph tracing prompting, RAG, ReAct, context engineering, MCP, skills, harnesses, and autonomous loops to one recurring structural law: when a model hits its compression frontier, external structure grows around it before partially absorbing back in.",
      io: {
        input: "Fragmented Agent Patterns & Empirical Field Signal",
        output: "First-Principles Theory (EN & 中文 PDF Monograph)",
      },
      commandLabel: "CORE AXIOM",
      command: "LAW // model hits compression boundary -> external harness grows -> partial absorption",
      guarantees: [
        "Distinguishes durable architectural leverage from temporary prompt scaffolding.",
        "Directly informs why X32 builds loops (self-loop), skill topology, and persistent memory (Argus).",
        "Published openly as bilingual English and Chinese PDF editions.",
      ],
      connections: {
        upstream: "argus",
        downstream: "self-loop",
        summary: "Synthesizes deep-research insights from Argus and defines the architectural axioms enforced by self-loop.",
      },
      visual: {
        type: "telemetry",
        title: "FIRST-PRINCIPLES AXIOM // EN + 中文",
        readouts: [
          { label: "THESIS", value: "Model outside the model", tone: "cyan" },
          { label: "CYCLE", value: "Edge -> Harness -> Absorb", tone: "violet" },
          { label: "FORMAT", value: "Bilingual PDF Monograph", tone: "ember" },
          { label: "LOOP", value: "Governs L1-L3 design", tone: "emerald" },
        ],
      },
      links: {
        primary: { label: "Read Monograph (PDF)", href: "https://github.com/X32Studio/agent-dao-public" },
      },
    },
  ],
  zh: [
    {
      id: "self-loop",
      code: "L1",
      name: "self-loop",
      badge: "v0.8.0 · 并行调度与组织引擎",
      role: "把乌合之众整编为可信 Agent Coding Team",
      oneLiner: "在 AI 时代守住人最稀缺的 Attention——解耦并行调度、防腐扫描、SSOT 漂移门禁与跨厂商验收，让你街边喝咖啡时照常交付。",
      description:
        "AI 时代人最大的瓶颈不是算力，而是注意力。self-loop v0.8.0 首尾串联规划生成、解耦并行调度合入（基于 arch-facts 依赖图）与跨厂商 Critic / Judge 对抗验收三大引擎，叠加双循环防腐扫描、SSOT 权威文档门禁、前提审计 exit 7 与 GitHub / AWS CodeBuild 实时 CI 回执。",
      io: {
        input: "目标规格 (P-NNNN) + 混乱的 Agent Swarm",
        output: "可信赖的 Agent Coding Team 与经验证的生产代码",
      },
      commandLabel: "5 秒闭环演示 (v0.8.0)",
      command: "git clone https://github.com/X32Studio/self-loop.git && cd self-loop && npm run demo",
      guarantees: [
        "三引擎联动：规划契约 + 基于 arch-facts 依赖图的并行 Actor 波次调度合入 + 跨厂商独立裁决。",
        "双循环节奏：有界重构窗口、确定性防腐扫描与 SSOT 权威文档漂移硬门禁。",
        "零 npm 依赖：原生适配 Claude Code / Codex / Antigravity 与 GitHub Actions / AWS CodeBuild。",
      ],
      connections: {
        upstream: "agent-dao",
        downstream: "skills-system",
        summary: "把 Agent DAO 的外部结构论落成工程闭环，并调度 L2 层规范化的 Skill 能力。",
      },
      visual: {
        type: "telemetry",
        title: "三引擎调度拓扑 // v0.8.0",
        readouts: [
          { label: "DISPATCH", value: "依赖图解耦并行波次", tone: "cyan" },
          { label: "ACTOR", value: "隔离波次提交与合入", tone: "violet" },
          { label: "JUDGE", value: "跨厂商干净检出裁决", tone: "ember" },
          { label: "GATES", value: "SSOT + 防腐 + 实时 CI", tone: "emerald" },
        ],
      },
      links: {
        primary: { label: "GitHub · self-loop", href: "https://github.com/X32Studio/self-loop" },
        secondary: { label: "阅读栈架构笔记", href: "/zh/blog/introducing-self-loop-and-x32-stack/" },
      },
    },
    {
      id: "skills-system",
      code: "L2",
      name: "System of Skills",
      badge: "SPEC · 技能拓扑",
      role: "多 Skill 系统工程架构规范",
      oneLiner: "终结触发冲突与组合退化，把零散 Agent Skills 组织成连贯系统。",
      description:
        "补齐单个 Skill 文档缺失的系统工程层：触发边界划分、能力唯一归属、冲突审计与演进治理，让第 20 个 Skill 的加入增强整体系统，而不是破坏前 19 个能力。",
      io: {
        input: "零散 Prompt、工具脚本与相互重叠的 Skills",
        output: "无冲突 Skill 拓扑图与确定性路由契约",
      },
      commandLabel: "架构契约",
      command: "skills/ -> trigger-boundaries + single-owner-capability -> deterministic dispatch",
      guarantees: [
        "显式划定触发包络，消除相近 Skill 之间的路由歧义与误触发。",
        "给出清晰准入准则，判断何时该新建 Skill、何时应沉淀到既有能力。",
        "源自真实生产部署，提供完整 HTML 排版指南与中英双语文档。",
      ],
      connections: {
        upstream: "self-loop",
        downstream: "argus",
        summary: "约束 self-loop 内部可复用能力边界，并为 Argus 这类复杂研究仪器提供封装范式。",
      },
      visual: {
        type: "telemetry",
        title: "路由完整性矩阵 // SPEC",
        readouts: [
          { label: "TRIGGERS", value: "互不重叠的意图边界", tone: "cyan" },
          { label: "OWNERSHIP", value: "单一能力唯一归属", tone: "violet" },
          { label: "COMPOSE", value: "分层交接契约", tone: "emerald" },
          { label: "DRIFT", value: "零静默组合退化", tone: "ember" },
        ],
      },
      links: {
        primary: { label: "GitHub · Skills 指南", href: "https://github.com/X32Studio/best-practice-for-skills-system" },
      },
    },
    {
      id: "argus",
      code: "L3",
      name: "Argus",
      badge: "TREE · 研究仪器",
      role: "持久知识树深度研究仪器",
      oneLiner: "从混乱信息场中持续深挖，一轮轮长出不断复利的持久研究树。",
      description:
        "打包为开箱即用的 Claude Code skill，自带实时可视化仪表盘。每一轮研究都向同一棵持久知识树追加来源引用、结构化笔记、实体关系、未解问题与报告更新，让长程课题永不从零开始。",
      io: {
        input: "宽泛研究课题 + 非结构化外部信源",
        output: "持久知识树、可视化仪表盘与演化报告",
      },
      commandLabel: "SKILL 启动",
      command: "/argus \"组织智能与碳硅混合智能架构演进\" --dashboard",
      guarantees: [
        "跨会话持久知识树持续累积证据，摆脱一次性对话窗口的失忆困境。",
        "显式追踪分歧点与未解问题，驱动下一轮定向深挖。",
        "一个窗口、一条命令完成初始化、仪表盘启动、研究循环与报告更新。",
      ],
      connections: {
        upstream: "skills-system",
        downstream: "agent-dao",
        summary: "遵循 L2 Skill 架构封装，将持续沉淀的一线研究证据回灌给 Agent DAO 理论与新任务。",
      },
      visual: {
        type: "image",
        src: "/assets/argus-dashboard.webp",
        alt: "Argus 持久研究树实时仪表盘界面",
        caption: "实时研究仪器 // 持久知识树与多轮深挖遥测视图",
      },
      links: {
        primary: { label: "GitHub · Argus", href: "https://github.com/X32Studio/Argus" },
        secondary: { label: "阅读 Argus 原理", href: "/zh/blog/how-argus-grows-a-research-tree/" },
      },
    },
    {
      id: "agent-dao",
      code: "L4",
      name: "Agent DAO",
      badge: "THESIS · 理论长文",
      role: "第一性原理专题长文",
      oneLiner: "Agent 是模型之外的模型——为何 Agent 不会消失，只会持续改变形态。",
      description:
        "中英双语系统性长文，把 prompting、RAG、ReAct、context engineering、MCP、skills、harness 与自主 loop 归结为同一条深层规律：当模型撞上既有压缩边界，外部结构便在其周围生长，随后再被部分吸收回模型本体。",
      io: {
        input: "碎片化的 Agent 工程实践与一线演进信号",
        output: "第一性原理框架（EN & 中文 PDF 长文）",
      },
      commandLabel: "核心公理",
      command: "LAW // 模型触及压缩边界 -> 外部结构生长 -> 局部吸收回模型",
      guarantees: [
        "区分长期有效的架构杠杆与短暂的 Prompt 脚手架。",
        "直接指导 X32 为何构建 self-loop 闭环、Skills 拓扑与 Argus 持久记忆。",
        "中英文完整 PDF 公开托管于 GitHub，持续迭代。",
      ],
      connections: {
        upstream: "argus",
        downstream: "self-loop",
        summary: "提炼自 Argus 与工程一线的深层规律，反过来为 self-loop 与整个栈确立设计公理。",
      },
      visual: {
        type: "telemetry",
        title: "第一性原理公理 // EN + 中文",
        readouts: [
          { label: "核心论点", value: "模型之外的模型", tone: "cyan" },
          { label: "演化律", value: "边界 -> 外部结构 -> 吸收", tone: "violet" },
          { label: "载体", value: "中英双语 PDF 长文", tone: "ember" },
          { label: "闭环", value: "反向约束 L1-L3 架构", tone: "emerald" },
        ],
      },
      links: {
        primary: { label: "阅读 PDF 长文", href: "https://github.com/X32Studio/agent-dao-public" },
      },
    },
  ],
};

export function getStackCopy(locale: Locale): StackCopy {
  return STACK_COPY[locale];
}

export function getStackLayers(locale: Locale): StackLayer[] {
  return STACK_LAYERS[locale];
}
