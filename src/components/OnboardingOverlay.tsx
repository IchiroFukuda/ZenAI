"use client";

interface OnboardingOverlayProps {
  showOnboarding: boolean;
  onClose: () => void;
}

export default function OnboardingOverlay({ showOnboarding, onClose }: OnboardingOverlayProps) {
  if (!showOnboarding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-10 max-w-md w-full text-center relative">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">ZenAIの世界へようこそ</h2>
        <p className="text-gray-700 mb-4">ここではAIは何も語りません。</p>
        <p className="text-gray-500 mb-4">ただAIはあなたの言葉を聞き、理解します。AIの意見を聞きたい場合は、記録ページを開いてください。</p>
        <button
          className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition"
          onClick={onClose}
        >
          はじめる
        </button>
      </div>
    </div>
  );
} 
