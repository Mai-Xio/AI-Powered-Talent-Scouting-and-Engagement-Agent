import { RecruiterWorkspace } from "@/components/RecruiterWorkspace";
import { sampleJds } from "@/lib/samples";

export default function Home() {
  return <RecruiterWorkspace samples={sampleJds} />;
}
