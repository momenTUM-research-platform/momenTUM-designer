// ProgressBar.tsx
import React from "react";

type Props = { value: number; label?: string; title?: string };
const clamp = (n: number) => Math.max(0, Math.min(100, n));

const ProgressBar: React.FC<Props> = ({ value, label, title }) => {
  const pct = clamp(value);
  return (
    <div className="w-full">
      {title && <div className="mb-1 text-sm text-gray-700">{title}</div>}
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div
          className="h-3 bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          role="progressbar"
        />
      </div>
      <div className="mt-1 text-xs text-gray-600">{label ?? `${pct}%`}</div>
    </div>
  );
};

export default ProgressBar;
