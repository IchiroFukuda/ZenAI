-- 既存のテーブルに対するRLSポリシーの追加
-- insightsテーブルは既に作成済みのため、テーブル作成は除外

-- thoughtsテーブルのRLSポリシー（既存のポリシーがある場合は削除してから）
DROP POLICY IF EXISTS "Users can view their own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can insert their own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can update their own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can delete their own thoughts" ON thoughts;

CREATE POLICY "Users can view their own thoughts" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thoughts" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thoughts" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- logsテーブルのRLSポリシー（既存のポリシーがある場合は削除してから）
DROP POLICY IF EXISTS "Users can view their own logs" ON logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;

CREATE POLICY "Users can view their own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" ON logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" ON logs
  FOR DELETE USING (auth.uid() = user_id);

-- insightsテーブルのRLSポリシー（既存のポリシーがある場合は削除してから）
DROP POLICY IF EXISTS "Users can view their own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON insights;

CREATE POLICY "Users can view their own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- ai_outputsテーブルを再作成（thought_idのみ使用）
DROP TABLE IF EXISTS ai_outputs CASCADE;

CREATE TABLE ai_outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- summary, analysis, tags, suggestion など
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_ai_outputs_thought_id ON ai_outputs(thought_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_type ON ai_outputs(type);

-- RLS（Row Level Security）有効化とポリシー
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai_outputs" ON ai_outputs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_outputs" ON ai_outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_outputs" ON ai_outputs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_outputs" ON ai_outputs
  FOR DELETE USING (auth.uid() = user_id);
