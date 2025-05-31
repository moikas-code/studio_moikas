import React from "react";
import { calculateGenerationMP } from "@/lib/generate_helpers";
import type { Model } from "@/lib/generate_helpers";

interface CostDisplayProps {
  model: Model | undefined;
}

const CostDisplay: React.FC<CostDisplayProps> = ({ model }) => {
  if (!model) return null;
  return (
    <div className=" z-50 bg-base-100 border border-base-300 rounded-xl shadow-lg px-4 py-3 text-base text-base-700 dark:text-base-700 flex flex-row items-center justify-between min-w-[150px] max-w-lg">
      <div className="flex flex-col items-end text-xs">
        <span className="text-base-800 dark:text-base-700">
          5s:{" "}
          <span className="font-bold text-jade">
            ~{calculateGenerationMP(model) * 5} MP
          </span>
        </span>
        <span className="text-base-800 dark:text-base-700">
          10s:{" "}
          <span className="font-bold text-jade">
            ~{calculateGenerationMP(model) * 10} MP
          </span>
        </span>
      </div>
    </div>
  );
};

export default CostDisplay;
