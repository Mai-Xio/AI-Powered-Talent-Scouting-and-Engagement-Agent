import type { CandidateProfile } from "./types";

export const seededCandidates: CandidateProfile[] = [
  {
    id: "maya-shah",
    name: "Maya Shah",
    headline: "Senior AI Product Engineer building recruiter-facing LLM workflows",
    location: "Bengaluru, India",
    workModes: ["remote", "hybrid"],
    seniority: "senior",
    yearsExperience: 8,
    domains: ["HR Tech", "AI", "Workflow Automation"],
    skills: [
      { skill: "Python", normalizedSkill: "python", years: 7, lastUsed: 2026, level: "expert", evidence: "Led Python services for candidate matching and outreach automation." },
      { skill: "RAG", normalizedSkill: "rag", years: 3, lastUsed: 2026, level: "advanced", evidence: "Built retrieval-augmented assistants over ATS notes and hiring rubrics." },
      { skill: "Vector Search", normalizedSkill: "vector-search", years: 4, lastUsed: 2026, level: "advanced", evidence: "Designed semantic candidate search over resume embeddings and skill aliases." },
      { skill: "LLM Evaluation", normalizedSkill: "llm-evaluation", years: 2, lastUsed: 2026, level: "advanced", evidence: "Created eval suites for hallucination, sourcing recall, and recruiter usefulness." },
      { skill: "Recruiting Operations", normalizedSkill: "recruiting-operations", years: 4, lastUsed: 2026, level: "advanced", evidence: "Partnered with talent ops on funnel analytics and outreach experiments." },
      { skill: "FastAPI", normalizedSkill: "fastapi", years: 5, lastUsed: 2026, level: "advanced", evidence: "Shipped FastAPI microservices for scoring and candidate enrichment." }
    ],
    projects: [
      {
        name: "Talent Graph Copilot",
        summary: "Explainable recruiter assistant that mapped JDs to skills, resumes, projects, and outreach readiness.",
        skills: ["rag", "vector-search", "recruiting-operations", "llm-evaluation"],
        impact: "Reduced screening time by 42 percent in pilot teams."
      },
      {
        name: "Outreach Simulator",
        summary: "Simulated candidate conversations to test messaging quality and compensation objections.",
        skills: ["conversational-ai", "prompt-engineering"],
        impact: "Improved positive response rates in A/B tests."
      }
    ],
    preferences: {
      roles: ["AI Product Engineer", "Applied AI Engineer", "Founding Engineer"],
      locations: ["Bengaluru", "Remote", "India"],
      workModes: ["remote", "hybrid"],
      compensationMin: 52000,
      openToRecruiter: 0.86,
      availabilityWeeks: 4,
      motivators: ["high-agency product work", "responsible AI", "measurable recruiter impact"],
      concerns: ["wants clarity on data privacy and product ownership"]
    },
    persona: {
      responseStyle: "Thoughtful, asks about product scope, shares evidence from prior HR tech work.",
      strongestInterest: "Excited by explainable AI for recruiters and real user feedback loops.",
      likelyObjection: "Needs assurance the tool augments recruiters rather than automating rejection.",
      closingSignal: "Happy to meet next week if the team can share product metrics and roadmap."
    }
  },
  {
    id: "leo-martin",
    name: "Leo Martin",
    headline: "Full-stack TypeScript engineer focused on AI SaaS workflows",
    location: "Austin, TX",
    workModes: ["remote", "hybrid"],
    seniority: "senior",
    yearsExperience: 7,
    domains: ["AI", "SaaS", "Product Analytics"],
    skills: [
      { skill: "TypeScript", normalizedSkill: "typescript", years: 7, lastUsed: 2026, level: "expert", evidence: "Built production TypeScript apps across frontend and backend." },
      { skill: "React", normalizedSkill: "react", years: 7, lastUsed: 2026, level: "expert", evidence: "Owned React dashboards for AI workflow monitoring." },
      { skill: "Next.js", normalizedSkill: "nextjs", years: 4, lastUsed: 2026, level: "advanced", evidence: "Shipped Next.js App Router customer portals." },
      { skill: "Node.js", normalizedSkill: "nodejs", years: 6, lastUsed: 2026, level: "advanced", evidence: "Built Node APIs for multi-tenant SaaS integrations." },
      { skill: "RAG", normalizedSkill: "rag", years: 2, lastUsed: 2025, level: "working", evidence: "Integrated RAG support bot into customer success product." },
      { skill: "Analytics", normalizedSkill: "analytics", years: 5, lastUsed: 2026, level: "advanced", evidence: "Designed funnel dashboards and instrumentation plans." }
    ],
    projects: [
      {
        name: "AI Workflow Studio",
        summary: "No-code workflow builder for support teams using LLM classification and routing.",
        skills: ["typescript", "react", "nextjs", "nodejs", "analytics"],
        impact: "Reached 12 enterprise teams in private beta."
      }
    ],
    preferences: {
      roles: ["Senior Full-stack Engineer", "AI Product Engineer"],
      locations: ["Remote", "Austin"],
      workModes: ["remote"],
      compensationMin: 165000,
      openToRecruiter: 0.72,
      availabilityWeeks: 6,
      motivators: ["customer-facing engineering", "fast shipping", "clear ownership"],
      concerns: ["less interested in pure backend roles"]
    },
    persona: {
      responseStyle: "Direct and pragmatic, asks about stack, customers, and equity.",
      strongestInterest: "Likes AI workflow products with visible customer usage.",
      likelyObjection: "Wants remote-first expectations and compensation range.",
      closingSignal: "Open to a 30-minute call if the role is product-heavy."
    }
  },
  {
    id: "amina-okafor",
    name: "Amina Okafor",
    headline: "Machine learning engineer specializing in evaluation and responsible AI",
    location: "London, UK",
    workModes: ["remote", "hybrid"],
    seniority: "staff",
    yearsExperience: 10,
    domains: ["AI", "Risk", "Fintech"],
    skills: [
      { skill: "Python", normalizedSkill: "python", years: 9, lastUsed: 2026, level: "expert", evidence: "Built Python model evaluation pipelines for regulated products." },
      { skill: "LLM Evaluation", normalizedSkill: "llm-evaluation", years: 3, lastUsed: 2026, level: "expert", evidence: "Created red-team and regression suites for LLM workflows." },
      { skill: "MLOps", normalizedSkill: "mlops", years: 6, lastUsed: 2026, level: "advanced", evidence: "Managed model deployment, monitoring, and rollback playbooks." },
      { skill: "NLP", normalizedSkill: "nlp", years: 7, lastUsed: 2025, level: "advanced", evidence: "Led NLP entity extraction and document classification systems." },
      { skill: "System Design", normalizedSkill: "system-design", years: 7, lastUsed: 2026, level: "advanced", evidence: "Designed high-throughput review workflows for model governance." }
    ],
    projects: [
      {
        name: "Trustworthy AI Review Bench",
        summary: "Evaluation harness for fairness, hallucination, and policy compliance.",
        skills: ["llm-evaluation", "mlops", "python"],
        impact: "Cut manual review effort by 30 percent while improving auditability."
      }
    ],
    preferences: {
      roles: ["Staff ML Engineer", "Responsible AI Lead"],
      locations: ["London", "Remote"],
      workModes: ["remote", "hybrid"],
      compensationMin: 140000,
      openToRecruiter: 0.62,
      availabilityWeeks: 10,
      motivators: ["responsible AI", "deep technical standards", "regulated workflows"],
      concerns: ["less interested in early UI-heavy product work"]
    },
    persona: {
      responseStyle: "Careful and rigorous, asks about governance and evaluation depth.",
      strongestInterest: "Interested if the team takes auditability seriously.",
      likelyObjection: "May see a recruiter tool as too product-led unless evaluation ownership is real.",
      closingSignal: "Will review the technical charter before committing to interviews."
    }
  },
  {
    id: "diego-ramirez",
    name: "Diego Ramirez",
    headline: "Talent operations analyst turned automation builder",
    location: "Mexico City, Mexico",
    workModes: ["remote"],
    seniority: "mid",
    yearsExperience: 5,
    domains: ["HR Tech", "Recruiting Operations", "Analytics"],
    skills: [
      { skill: "Recruiting Operations", normalizedSkill: "recruiting-operations", years: 5, lastUsed: 2026, level: "expert", evidence: "Owned ATS workflows, interviewer SLAs, and sourcing funnel hygiene." },
      { skill: "Analytics", normalizedSkill: "analytics", years: 5, lastUsed: 2026, level: "advanced", evidence: "Built recruiting dashboards for source quality and stage conversion." },
      { skill: "Workflow Automation", normalizedSkill: "workflow-automation", years: 3, lastUsed: 2026, level: "advanced", evidence: "Automated candidate reminders, scorecard routing, and recruiter follow-ups." },
      { skill: "PostgreSQL", normalizedSkill: "postgres", years: 3, lastUsed: 2025, level: "working", evidence: "Queried ATS and warehouse data for funnel reporting." },
      { skill: "Product Management", normalizedSkill: "product-management", years: 2, lastUsed: 2025, level: "working", evidence: "Scoped internal recruiting tools with sourcers and hiring managers." }
    ],
    projects: [
      {
        name: "Talent Funnel OS",
        summary: "Automation layer for candidate status, interview plans, and recruiter alerts.",
        skills: ["recruiting-operations", "analytics", "workflow-automation"],
        impact: "Reduced missed follow-ups by 55 percent."
      }
    ],
    preferences: {
      roles: ["Recruiting Operations Lead", "HR Tech Product Analyst"],
      locations: ["Remote", "Mexico City"],
      workModes: ["remote"],
      compensationMin: 65000,
      openToRecruiter: 0.78,
      availabilityWeeks: 3,
      motivators: ["talent workflow improvement", "automation", "ops-to-product path"],
      concerns: ["not a full-time software engineer"]
    },
    persona: {
      responseStyle: "Warm and practical, talks in funnel metrics and recruiter pain points.",
      strongestInterest: "Very interested in tools that make recruiting teams faster.",
      likelyObjection: "Concerned about coding depth if the role is senior engineering.",
      closingSignal: "Interested in product or solutions roles adjacent to engineering."
    }
  },
  {
    id: "nora-kim",
    name: "Nora Kim",
    headline: "Frontend architect for data-rich product dashboards",
    location: "Toronto, Canada",
    workModes: ["remote", "hybrid"],
    seniority: "senior",
    yearsExperience: 9,
    domains: ["SaaS", "UI Systems", "Analytics"],
    skills: [
      { skill: "React", normalizedSkill: "react", years: 8, lastUsed: 2026, level: "expert", evidence: "Led frontend architecture for dense analytics dashboards." },
      { skill: "TypeScript", normalizedSkill: "typescript", years: 7, lastUsed: 2026, level: "expert", evidence: "Established strict TypeScript patterns and shared UI libraries." },
      { skill: "UI Systems", normalizedSkill: "ui-systems", years: 6, lastUsed: 2026, level: "expert", evidence: "Created design systems and accessibility review workflows." },
      { skill: "User Research", normalizedSkill: "user-research", years: 3, lastUsed: 2025, level: "working", evidence: "Observed operators using dashboards and redesigned scanning patterns." },
      { skill: "Next.js", normalizedSkill: "nextjs", years: 3, lastUsed: 2025, level: "advanced", evidence: "Migrated a dashboard suite to Next.js." }
    ],
    projects: [
      {
        name: "Signal Desk",
        summary: "High-density dashboard for operations teams to triage events and compare segments.",
        skills: ["react", "typescript", "ui-systems", "analytics"],
        impact: "Improved triage speed and reduced navigation friction."
      }
    ],
    preferences: {
      roles: ["Frontend Architect", "Senior Product Engineer"],
      locations: ["Remote", "Toronto"],
      workModes: ["remote", "hybrid"],
      compensationMin: 150000,
      openToRecruiter: 0.58,
      availabilityWeeks: 8,
      motivators: ["complex UI", "accessibility", "operator workflows"],
      concerns: ["not looking for backend-heavy AI infra work"]
    },
    persona: {
      responseStyle: "Concise, design-sensitive, asks to see user workflows.",
      strongestInterest: "Likes data-rich tools for expert users.",
      likelyObjection: "Wants frontend leadership, not a generic full-stack role.",
      closingSignal: "Open if the team values craft and accessibility."
    }
  },
  {
    id: "samir-patel",
    name: "Samir Patel",
    headline: "Backend platform engineer for data-intensive systems",
    location: "Pune, India",
    workModes: ["hybrid", "onsite"],
    seniority: "senior",
    yearsExperience: 8,
    domains: ["Data", "Platform", "Fintech"],
    skills: [
      { skill: "Node.js", normalizedSkill: "nodejs", years: 6, lastUsed: 2026, level: "advanced", evidence: "Built Node.js APIs for ledger and reporting services." },
      { skill: "PostgreSQL", normalizedSkill: "postgres", years: 7, lastUsed: 2026, level: "expert", evidence: "Designed PostgreSQL schemas for high-volume financial data." },
      { skill: "Data Pipelines", normalizedSkill: "data-pipelines", years: 6, lastUsed: 2026, level: "advanced", evidence: "Owned data ingestion and reconciliation pipelines." },
      { skill: "System Design", normalizedSkill: "system-design", years: 7, lastUsed: 2026, level: "advanced", evidence: "Scaled event-driven services with clear SLOs." },
      { skill: "API Design", normalizedSkill: "api-design", years: 7, lastUsed: 2026, level: "advanced", evidence: "Designed public and internal REST APIs." }
    ],
    projects: [
      {
        name: "Realtime Risk Ledger",
        summary: "Backend platform for risk events, accounting sync, and audit trails.",
        skills: ["nodejs", "postgres", "data-pipelines", "system-design"],
        impact: "Processed millions of daily events with lower incident rates."
      }
    ],
    preferences: {
      roles: ["Backend Platform Engineer", "Senior Software Engineer"],
      locations: ["Pune", "Bengaluru"],
      workModes: ["hybrid"],
      compensationMin: 48000,
      openToRecruiter: 0.52,
      availabilityWeeks: 6,
      motivators: ["scale", "clean backend ownership", "reliable systems"],
      concerns: ["less interested in AI product prototyping"]
    },
    persona: {
      responseStyle: "Technical and focused on system requirements.",
      strongestInterest: "Likes stable backend ownership and strong engineering culture.",
      likelyObjection: "May not value recruiter workflow domain.",
      closingSignal: "Would continue if backend scope is central."
    }
  },
  {
    id: "elena-volkova",
    name: "Elena Volkova",
    headline: "Applied NLP engineer with chatbot and semantic search experience",
    location: "Berlin, Germany",
    workModes: ["remote", "hybrid"],
    seniority: "senior",
    yearsExperience: 7,
    domains: ["AI", "Customer Support", "Knowledge Management"],
    skills: [
      { skill: "NLP", normalizedSkill: "nlp", years: 7, lastUsed: 2026, level: "expert", evidence: "Built NLP extraction and classification services." },
      { skill: "Conversational AI", normalizedSkill: "conversational-ai", years: 5, lastUsed: 2026, level: "advanced", evidence: "Launched multilingual support chatbots with escalation workflows." },
      { skill: "Vector Search", normalizedSkill: "vector-search", years: 4, lastUsed: 2026, level: "advanced", evidence: "Built semantic search over customer knowledge bases." },
      { skill: "Python", normalizedSkill: "python", years: 7, lastUsed: 2026, level: "expert", evidence: "Implemented Python services for model inference and enrichment." },
      { skill: "Prompt Engineering", normalizedSkill: "prompt-engineering", years: 3, lastUsed: 2026, level: "advanced", evidence: "Designed prompts and guardrails for customer-facing assistants." }
    ],
    projects: [
      {
        name: "Knowledge Concierge",
        summary: "Conversational AI tool over support articles, tickets, and product docs.",
        skills: ["conversational-ai", "vector-search", "nlp", "prompt-engineering"],
        impact: "Deflected repetitive tickets while preserving escalation quality."
      }
    ],
    preferences: {
      roles: ["Applied NLP Engineer", "AI Engineer"],
      locations: ["Remote", "Berlin"],
      workModes: ["remote", "hybrid"],
      compensationMin: 115000,
      openToRecruiter: 0.68,
      availabilityWeeks: 5,
      motivators: ["semantic search", "chat UX", "international products"],
      concerns: ["prefers model quality work over sales automation"]
    },
    persona: {
      responseStyle: "Curious and detail-oriented, asks about language support and quality metrics.",
      strongestInterest: "Interested in conversational assessment and semantic matching.",
      likelyObjection: "Needs to understand whether the domain is ethically handled.",
      closingSignal: "Open to next steps with a technical deep dive."
    }
  },
  {
    id: "owen-brooks",
    name: "Owen Brooks",
    headline: "Product manager for B2B workflow automation",
    location: "Denver, CO",
    workModes: ["remote"],
    seniority: "lead",
    yearsExperience: 11,
    domains: ["Product", "Workflow Automation", "B2B SaaS"],
    skills: [
      { skill: "Product Management", normalizedSkill: "product-management", years: 9, lastUsed: 2026, level: "expert", evidence: "Led product discovery, pricing, and roadmap for B2B workflow products." },
      { skill: "User Research", normalizedSkill: "user-research", years: 7, lastUsed: 2026, level: "advanced", evidence: "Ran customer interviews and usability studies with operators." },
      { skill: "Experimentation", normalizedSkill: "experimentation", years: 5, lastUsed: 2026, level: "advanced", evidence: "Owned A/B tests and adoption metrics." },
      { skill: "Workflow Automation", normalizedSkill: "workflow-automation", years: 6, lastUsed: 2026, level: "advanced", evidence: "Launched automation features for repetitive enterprise processes." },
      { skill: "Analytics", normalizedSkill: "analytics", years: 6, lastUsed: 2026, level: "advanced", evidence: "Defined activation, retention, and usage dashboards." }
    ],
    projects: [
      {
        name: "OpsFlow",
        summary: "Workflow product for approvals, reminders, and manager visibility.",
        skills: ["product-management", "workflow-automation", "analytics", "user-research"],
        impact: "Increased weekly active teams by 33 percent."
      }
    ],
    preferences: {
      roles: ["Lead Product Manager", "AI Product Lead"],
      locations: ["Remote", "Denver"],
      workModes: ["remote"],
      compensationMin: 170000,
      openToRecruiter: 0.65,
      availabilityWeeks: 8,
      motivators: ["product strategy", "workflow depth", "metrics ownership"],
      concerns: ["not interested in IC engineering"]
    },
    persona: {
      responseStyle: "Strategic, asks about market and customer adoption.",
      strongestInterest: "Likes recruiter workflow automation.",
      likelyObjection: "Would not be a match for a code-heavy engineer role.",
      closingSignal: "Interested in product leadership paths."
    }
  }
];
