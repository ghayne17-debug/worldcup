-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists draw_config (
  id int primary key check (id = 1),
  is_drawn boolean not null default false,
  drawn_at timestamptz
);
insert into draw_config (id, is_drawn) values (1, false) on conflict (id) do nothing;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  display_name text not null,
  email text not null,
  teams_wanted int not null default 1 check (teams_wanted >= 1 and teams_wanted <= 20),
  teams_paid int not null default 0,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id serial primary key,
  name text not null,
  group_name text not null,
  flag_emoji text not null default '🌍',
  owner_user_id uuid references auth.users,
  owner_name text,
  current_stage text not null default 'Group Stage',
  is_eliminated boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table draw_config enable row level security;
alter table participants enable row level security;
alter table teams enable row level security;

create policy "draw_config_read" on draw_config for select using (true);
create policy "participants_read" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (auth.uid() = user_id);
create policy "participants_update" on participants for update using (auth.uid() = user_id);
create policy "teams_read" on teams for select using (true);

-- ─────────────────────────────────────────────
-- Seed: 48 FIFA World Cup 2026 Teams
-- SOURCE: Official FIFA draw, December 2024
-- Verify at: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
-- ─────────────────────────────────────────────

insert into teams (name, group_name, flag_emoji) values
  ('Mexico',                  'A', '🇲🇽'),
  ('South Africa',            'A', '🇿🇦'),
  ('South Korea',             'A', '🇰🇷'),
  ('Czech Republic',          'A', '🇨🇿'),
  ('Canada',                  'B', '🇨🇦'),
  ('Bosnia and Herzegovina',  'B', '🇧🇦'),
  ('Qatar',                   'B', '🇶🇦'),
  ('Switzerland',             'B', '🇨🇭'),
  ('Brazil',                  'C', '🇧🇷'),
  ('Morocco',                 'C', '🇲🇦'),
  ('Haiti',                   'C', '🇭🇹'),
  ('Scotland',                'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('United States',           'D', '🇺🇸'),
  ('Paraguay',                'D', '🇵🇾'),
  ('Australia',               'D', '🇦🇺'),
  ('Turkey',                  'D', '🇹🇷'),
  ('Germany',                 'E', '🇩🇪'),
  ('Curacao',                 'E', '🇨🇼'),
  ('Ivory Coast',             'E', '🇨🇮'),
  ('Ecuador',                 'E', '🇪🇨'),
  ('Netherlands',             'F', '🇳🇱'),
  ('Japan',                   'F', '🇯🇵'),
  ('Sweden',                  'F', '🇸🇪'),
  ('Tunisia',                 'F', '🇹🇳'),
  ('Belgium',                 'G', '🇧🇪'),
  ('Egypt',                   'G', '🇪🇬'),
  ('Iran',                    'G', '🇮🇷'),
  ('New Zealand',             'G', '🇳🇿'),
  ('Spain',                   'H', '🇪🇸'),
  ('Cape Verde',              'H', '🇨🇻'),
  ('Saudi Arabia',            'H', '🇸🇦'),
  ('Uruguay',                 'H', '🇺🇾'),
  ('France',                  'I', '🇫🇷'),
  ('Senegal',                 'I', '🇸🇳'),
  ('Iraq',                    'I', '🇮🇶'),
  ('Norway',                  'I', '🇳🇴'),
  ('Argentina',               'J', '🇦🇷'),
  ('Algeria',                 'J', '🇩🇿'),
  ('Austria',                 'J', '🇦🇹'),
  ('Jordan',                  'J', '🇯🇴'),
  ('Portugal',                'K', '🇵🇹'),
  ('DR Congo',                'K', '🇨🇩'),
  ('Uzbekistan',              'K', '🇺🇿'),
  ('Colombia',                'K', '🇨🇴'),
  ('England',                 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croatia',                 'L', '🇭🇷'),
  ('Ghana',                   'L', '🇬🇭'),
  ('Panama',                  'L', '🇵🇦');
