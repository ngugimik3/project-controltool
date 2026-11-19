import Link from "next/link";
import { RANGE_KEYS, RANGE_SHORT, type RangeKey } from "@/lib/dashboard";

export function RangeFilter({ value }: { value: RangeKey }) {
  return (
    <div className="range-filter" role="group" aria-label="Dashboard date range">
      {RANGE_KEYS.map((key) => (
        <Link
          key={key}
          href={`/dashboard?range=${key}`}
          aria-current={key === value ? "page" : undefined}
          title={`Last ${RANGE_SHORT[key]}`}
        >
          {RANGE_SHORT[key]}
        </Link>
      ))}
    </div>
  );
}
