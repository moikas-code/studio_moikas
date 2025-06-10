import React from "react";

interface CostDisplayProps {
  model?: {
    cost: number;
    duration_options?: number[];
  };
  cost?: number;
  planType?: string | null;
}

const CostDisplay: React.FC<CostDisplayProps> = ({ model, cost }) => {
  // If cost is provided directly, use it
  if (cost !== undefined) {
    return (
      <div className="z-50 bg-base-100 border border-base-300 rounded-xl shadow-lg px-4 py-3 text-base text-base-700 dark:text-base-700 flex flex-row items-center justify-between min-w-[150px] max-w-lg">
        <div className="flex flex-col items-end text-xs">
          <span className="text-base-800 dark:text-base-700">
            Cost:{" "}
            <span className="font-bold text-jade">
              ~{cost} MP
            </span>
          </span>
        </div>
      </div>
    );
  }
  
  // If model is provided, calculate costs
  if (!model) return null;
  
  // For video models, show cost per second times duration
  const durations = model.duration_options || [5, 10];
  
  return (
    <div className=" z-50 bg-base-100 border border-base-300 rounded-xl shadow-lg px-4 py-3 text-base text-base-700 dark:text-base-700 flex flex-row items-center justify-between min-w-[150px] max-w-lg">
      <div className="flex flex-col items-end text-xs">
        {durations.map(duration => (
          <span key={duration} className="text-base-800 dark:text-base-700">
            {duration}s:{" "}
            <span className="font-bold text-jade">
              ~{model.cost * duration} MP
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CostDisplay;
