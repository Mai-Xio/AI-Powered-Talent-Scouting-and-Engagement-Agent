import { NextResponse } from "next/server";
import { runRecruiterAgent } from "@/lib/agent";
import type { AgentRunRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentRunRequest;
    if (typeof body.jdText !== "string" || body.jdText.trim().length < 40) {
      return NextResponse.json({ error: "Please provide a job description with at least 40 characters." }, { status: 400 });
    }

    const result = await runRecruiterAgent(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Agent run failed." }, { status: 500 });
  }
}
