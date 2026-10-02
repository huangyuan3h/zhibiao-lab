import type { Verdict } from "@/lib/data";
import { Badge } from "./ui/badge";

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const variant = verdict === "不赚钱" ? "red" : verdict === "有苗头" ? "amber" : "gray";
  return <Badge variant={variant}>{verdict}</Badge>;
}
