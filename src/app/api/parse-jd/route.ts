import { NextResponse } from "next/server";
import { parseJobDescription } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jdText?: string };
    if (typeof body.jdText !== "string") {
      return NextResponse.json({ error: "Missing jdText." }, { status: 400 });
    }
    return NextResponse.json(parseJobDescription(body.jdText));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "JD parsing failed." }, { status: 500 });
  }
}
