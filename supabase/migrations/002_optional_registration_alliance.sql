-- Existing Kingdom 2312 database: allow registration without alliance selection.
-- Preserves all existing members, forms, and alliance values. Safe to rerun.
alter table public.members alter column alliance drop not null;
