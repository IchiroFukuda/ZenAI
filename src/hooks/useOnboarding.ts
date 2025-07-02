import { useState, useEffect } from "react";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 初回オンボーディング判定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('zenai-onboarded');
      if (!onboarded) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenai-onboarded', '1');
    }
  };

  return {
    showOnboarding,
    handleCloseOnboarding,
  };
} 
