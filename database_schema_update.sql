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

-- 各テーブルでRLSを有効化（既に有効化されている場合はエラーにならない）
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY; 
