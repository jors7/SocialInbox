-- Enable Realtime for required tables
-- Run this in the SQL editor if you can't access the Replication settings

-- Enable realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for flow_executions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.flow_executions;

-- Verify realtime is enabled (optional)
SELECT
  schemaname,
  tablename
FROM
  pg_publication_tables
WHERE
  pubname = 'supabase_realtime';