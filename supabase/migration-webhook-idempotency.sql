create table if not exists webhook_idempotency (
  request_id text primary key,
  created_at timestamptz not null default now()
);

alter table webhook_idempotency enable row level security;

create policy "service_role manages webhook_idempotency"
  on webhook_idempotency
  using (true)
  with check (true);
