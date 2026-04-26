import { NextResponse } from "next/server";
import { seededCandidates } from "@/lib/candidates";
import { parseJobDescription } from "@/lib/parser";
import { scoreInterest, simulateOutreach } from "@/lib/outreach";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jdText?: string; candidateId?: string };
    if (typeof body.jdText !== "string" || typeof body.candidateId !== "string") {
      return NextResponse.json({ error: "Missing jdText or candidateId." }, { status: 400 });
    }
    const jd = parseJobDescription(body.jdText);
    const candidate = seededCandidates.find((item) => item.id === body.candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }
    return NextResponse.json({
      transcript: simulateOutreach(candidate, jd),
      interest: scoreInterest(candidate, jd)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Outreach simulation failed." }, { status: 500 });
  }
}
