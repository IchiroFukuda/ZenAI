-- 思考セッションテーブル
CREATE TABLE thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存のlogsテーブルにthought_idを追加
ALTER TABLE logs ADD COLUMN thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE;

-- インデックスを作成
CREATE INDEX idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX idx_logs_thought_id ON logs(thought_id);

-- RLSポリシー
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- thoughtsテーブルのポリシー
CREATE POLICY "Users can view their own thoughts" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thoughts" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thoughts" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- logsテーブルのポリシー（既存のポリシーがある場合は削除してから）
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

-- ユーザーの記録に対するAIの気づきを保存するテーブル
CREATE TABLE IF NOT EXISTS insights (
  id SERIAL PRIMARY KEY,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 
 