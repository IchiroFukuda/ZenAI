import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAutoAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const previousUserRef = useRef<any>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 現在の認証状態を取得
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          setUser(currentUser);
          previousUserRef.current = currentUser;
        } else {
          // 未ログインの場合、匿名認証を実行
          const { data, error } = await supabase.auth.signInAnonymously();
          
          if (error) {
            console.error("自動匿名認証エラー:", error);
            setUser(null);
          } else if (data.user) {
            setUser(data.user);
            previousUserRef.current = data.user;
            console.log("新しい匿名ユーザーを作成:", data.user.id);
          }
        }
      } catch (error) {
        console.error("認証初期化エラー:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("認証状態変更:", event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        previousUserRef.current = session.user;
      } else {
        setUser(null);
        previousUserRef.current = null;
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ログアウト
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 匿名ユーザー判定
  const isAnonymous = user?.email?.startsWith('anon-') || user?.is_anonymous === true;

  return {
    user,
    loading,
    isAnonymous,
    signOut
  };
} 
