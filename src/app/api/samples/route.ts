import { NextResponse } from "next/server";
import { expectedSampleOutput, sampleJds } from "@/lib/samples";

export function GET() {
  return NextResponse.json({
    sampleJds,
    expectedSampleOutput
  });
}
