import React from "react";
import { format } from 'date-fns';

type AIOutput = {
  summary?: string;
  tags?: string;
  analysis?: string;
  suggestion?: string;
  created_at?: string;
};

type Props = {
  aiOutputs: AIOutput[];
};

export default function AIOutputBox({ aiOutputs }: Props) {
  if (!aiOutputs || aiOutputs.length === 0) return null;
  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded shadow space-y-6">
      <h2 className="font-bold text-lg mb-2 text-gray-700">AIの考察（新しい順）</h2>
      {aiOutputs.map((output, idx) => (
        <div key={idx} className="border-b pb-3 mb-3">
          {output.created_at && (
            <div className="text-xs text-gray-400 mb-2">
              {new Date(output.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          {output.summary && (
            <div>
              <div className="font-semibold text-blue-700 mb-1">要約</div>
              <div className="text-gray-800 whitespace-pre-line">{output.summary}</div>
            </div>
          )}
          {output.tags && (
            <div>
              <div className="font-semibold text-blue-700 mb-1">タグ</div>
              <div className="text-gray-800 whitespace-pre-line">{output.tags}</div>
            </div>
          )}
          {output.analysis && (
            <div>
              <div className="font-semibold text-blue-700 mb-1">分析</div>
              <div className="text-gray-800 whitespace-pre-line">{output.analysis}</div>
            </div>
          )}
          {output.suggestion && (
            <div>
              <div className="font-semibold text-blue-700 mb-1">提案</div>
              <div className="text-gray-800 whitespace-pre-line">{output.suggestion}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 
