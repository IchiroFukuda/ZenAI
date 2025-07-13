import React from "react";

type AIOutput = {
  type: string;
  content: string;
};

type Props = {
  aiOutputs: AIOutput[];
};

const typeTitleMap: Record<string, string> = {
  summary: "要約",
  tags: "タグ",
  analysis: "分析",
  suggestion: "提案",
};

export default function AIOutputBox({ aiOutputs }: Props) {
  if (!aiOutputs || aiOutputs.length === 0) return null;
  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded shadow space-y-6">
      <h2 className="font-bold text-lg mb-2 text-gray-700">AIの考察</h2>
      {Object.keys(typeTitleMap).map((type) => {
        const output = aiOutputs.find((o) => o.type === type);
        if (!output) return null;
        return (
          <div key={type}>
            <div className="font-semibold text-blue-700 mb-1">{typeTitleMap[type]}</div>
            <div className="text-gray-800 whitespace-pre-line">{output.content}</div>
          </div>
        );
      })}
    </div>
  );
} 
