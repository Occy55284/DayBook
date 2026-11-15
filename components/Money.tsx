import { moneyParts } from "@/lib/format";

// An amount of money for the big totals: the pence are smaller and lighter.
// Read aloud (and copied) it is still exactly "£1,234.50".
export default function Money({ value }: { value: number }) {
  const p = moneyParts(value);
  return (
    <>
      {p.sign}{p.symbol}{p.whole}<span className="pence">{p.pence}</span>
    </>
  );
}
