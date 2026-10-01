import type { Verdict } from "@/lib/data";

const styles: Record<Verdict, string> = {
  不赚钱: "bg-red-100 text-red-800 border-red-200",
  有苗头: "bg-amber-100 text-amber-800 border-amber-200",
  只研究: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[verdict]}`}
    >
      {verdict}
    </span>
  );
}
