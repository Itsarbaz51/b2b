import React from "react";

const ContributionGraph = ({ data = [] }) => {
    console.log(data);
    
  const getColor = (level) => {
    if (!level) return "bg-gray-200";
    if (level === 1) return "bg-green-200";
    if (level === 2) return "bg-green-400";
    if (level === 3) return "bg-green-600";
    if (level === 4) return "bg-green-800";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-52 gap-0.75">
        {data.map((day, i) => (
          <div
            key={i}
            title={`${day.date} : ${day.count} events`}
            className={`w-3 h-3 rounded-sm ${getColor(day.level)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ContributionGraph;
