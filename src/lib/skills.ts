export type SkillNode = {
  id: string;
  label: string;
  aliases: string[];
  category: string;
  adjacent: string[];
};

export const skillGraph: SkillNode[] = [
  {
    id: "python",
    label: "Python",
    aliases: ["python3", "py"],
    category: "Programming",
    adjacent: ["fastapi", "mlops", "data-pipelines"]
  },
  {
    id: "typescript",
    label: "TypeScript",
    aliases: ["ts", "typed javascript"],
    category: "Programming",
    adjacent: ["react", "nextjs", "nodejs"]
  },
  {
    id: "react",
    label: "React",
    aliases: ["react.js", "reactjs"],
    category: "Frontend",
    adjacent: ["typescript", "nextjs", "ui-systems"]
  },
  {
    id: "nextjs",
    label: "Next.js",
    aliases: ["next", "next js"],
    category: "Frontend",
    adjacent: ["react", "typescript", "vercel"]
  },
  {
    id: "nodejs",
    label: "Node.js",
    aliases: ["node", "node js"],
    category: "Backend",
    adjacent: ["typescript", "api-design", "postgres"]
  },
  {
    id: "fastapi",
    label: "FastAPI",
    aliases: ["fast api"],
    category: "Backend",
    adjacent: ["python", "api-design", "mlops"]
  },
  {
    id: "api-design",
    label: "API Design",
    aliases: ["rest api", "restful api", "api development"],
    category: "Backend",
    adjacent: ["nodejs", "fastapi", "system-design"]
  },
  {
    id: "postgres",
    label: "PostgreSQL",
    aliases: ["postgres", "sql"],
    category: "Data",
    adjacent: ["data-pipelines", "nodejs", "analytics"]
  },
  {
    id: "vector-search",
    label: "Vector Search",
    aliases: ["embeddings search", "semantic search", "ann search", "similarity search"],
    category: "AI",
    adjacent: ["rag", "llm-evaluation", "mlops"]
  },
  {
    id: "rag",
    label: "RAG",
    aliases: ["retrieval augmented generation", "retrieval-augmented generation"],
    category: "AI",
    adjacent: ["vector-search", "llm-evaluation", "prompt-engineering"]
  },
  {
    id: "prompt-engineering",
    label: "Prompt Engineering",
    aliases: ["prompt design", "prompting"],
    category: "AI",
    adjacent: ["rag", "llm-evaluation", "conversational-ai"]
  },
  {
    id: "llm-evaluation",
    label: "LLM Evaluation",
    aliases: ["evals", "model evaluation", "llm evals"],
    category: "AI",
    adjacent: ["rag", "mlops", "analytics"]
  },
  {
    id: "mlops",
    label: "MLOps",
    aliases: ["model operations", "ml ops"],
    category: "AI",
    adjacent: ["python", "vector-search", "data-pipelines"]
  },
  {
    id: "data-pipelines",
    label: "Data Pipelines",
    aliases: ["etl", "elt", "data engineering"],
    category: "Data",
    adjacent: ["postgres", "python", "analytics"]
  },
  {
    id: "analytics",
    label: "Analytics",
    aliases: ["product analytics", "data analysis"],
    category: "Data",
    adjacent: ["postgres", "data-pipelines", "experimentation"]
  },
  {
    id: "experimentation",
    label: "Experimentation",
    aliases: ["ab testing", "a/b testing", "experiments"],
    category: "Product",
    adjacent: ["analytics", "product-management"]
  },
  {
    id: "product-management",
    label: "Product Management",
    aliases: ["product strategy", "product discovery"],
    category: "Product",
    adjacent: ["experimentation", "user-research", "stakeholder-management"]
  },
  {
    id: "user-research",
    label: "User Research",
    aliases: ["customer research", "ux research"],
    category: "Product",
    adjacent: ["product-management", "ui-systems"]
  },
  {
    id: "ui-systems",
    label: "UI Systems",
    aliases: ["design systems", "frontend architecture"],
    category: "Frontend",
    adjacent: ["react", "user-research"]
  },
  {
    id: "conversational-ai",
    label: "Conversational AI",
    aliases: ["chatbot", "chatbots", "dialogue systems"],
    category: "AI",
    adjacent: ["prompt-engineering", "rag", "nlp"]
  },
  {
    id: "nlp",
    label: "NLP",
    aliases: ["natural language processing", "text mining"],
    category: "AI",
    adjacent: ["conversational-ai", "python", "llm-evaluation"]
  },
  {
    id: "system-design",
    label: "System Design",
    aliases: ["architecture", "distributed systems"],
    category: "Engineering",
    adjacent: ["api-design", "nodejs", "mlops"]
  },
  {
    id: "recruiting-operations",
    label: "Recruiting Operations",
    aliases: ["talent operations", "recruitment operations", "ats workflows"],
    category: "HR Tech",
    adjacent: ["hr-tech", "analytics", "workflow-automation"]
  },
  {
    id: "hr-tech",
    label: "HR Tech",
    aliases: ["human resources technology", "talent software"],
    category: "HR Tech",
    adjacent: ["recruiting-operations", "workflow-automation", "product-management"]
  },
  {
    id: "workflow-automation",
    label: "Workflow Automation",
    aliases: ["automation", "process automation"],
    category: "Operations",
    adjacent: ["recruiting-operations", "api-design", "product-management"]
  }
];

const allSkillTerms = skillGraph.flatMap((skill) => [
  { term: skill.label.toLowerCase(), id: skill.id },
  ...skill.aliases.map((alias) => ({ term: alias.toLowerCase(), id: skill.id }))
]);

export function getSkill(id: string): SkillNode | undefined {
  return skillGraph.find((skill) => skill.id === id);
}

export function normalizeSkill(input: string): string {
  const value = input.toLowerCase().trim().replace(/[().]/g, "").replace(/\s+/g, " ");
  const exact = skillGraph.find((skill) => skill.id === value || skill.label.toLowerCase() === value);
  if (exact) return exact.id;

  const alias = allSkillTerms.find((term) => term.term === value);
  if (alias) return alias.id;

  const partial = allSkillTerms.find((term) => value.includes(term.term) || term.term.includes(value));
  return partial?.id ?? value.replace(/[^a-z0-9]+/g, "-");
}

export function labelForSkill(id: string): string {
  return getSkill(id)?.label ?? id.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

export function areAdjacentSkills(left: string, right: string): boolean {
  const leftNode = getSkill(left);
  const rightNode = getSkill(right);
  if (!leftNode || !rightNode) return false;
  return leftNode.adjacent.includes(right) || rightNode.adjacent.includes(left);
}

export function extractKnownSkills(text: string): Array<{ id: string; label: string; evidence: string }> {
  const lower = ` ${text.toLowerCase()} `;
  const matches = new Map<string, string>();

  for (const skill of skillGraph) {
    const terms = [skill.label, ...skill.aliases].map((term) => term.toLowerCase());
    const term = terms.find((candidate) => lower.includes(` ${candidate} `) || lower.includes(candidate));
    if (term) {
      const evidence = findEvidenceSentence(text, term);
      matches.set(skill.id, evidence || skill.label);
    }
  }

  return [...matches.entries()].map(([id, evidence]) => ({
    id,
    label: labelForSkill(id),
    evidence
  }));
}

export function findEvidenceSentence(text: string, term: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return sentences.find((sentence) => sentence.toLowerCase().includes(term.toLowerCase())) ?? "";
}
