-- Add subject column to contact_submissions table
alter table public.contact_submissions
  add column if not exists subject text not null default '';
