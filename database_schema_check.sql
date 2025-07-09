-- 既存のテーブル構造を確認し、必要なカラムを追加するSQL

-- thoughtsテーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- logsテーブルにthought_idカラムが存在しない場合のみ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'logs' AND column_name = 'thought_id'
  ) THEN
    ALTER TABLE logs ADD COLUMN thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- インデックスが存在しない場合のみ作成
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_thought_id ON logs(thought_id);

-- insightsテーブルのuser_idカラムがauth.usersを参照するように修正（必要に応じて）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'insights' AND column_name = 'user_id'
  ) THEN
    -- user_idカラムの外部キー制約を確認し、必要に応じて修正
    -- 既存の制約を削除して新しい制約を追加
    ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_user_id_fkey;
    ALTER TABLE insights ADD CONSTRAINT insights_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$; 
