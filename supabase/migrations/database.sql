create table public.restaurants (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  name text not null,
  phone text null,
  address text null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  unique_key text not null default encode(extensions.gen_random_bytes (16), 'hex'::text),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  description text null,
  images text[] null default '{}'::text[],
  closing_time time without time zone null,
  business_hours jsonb null default '{"friday": {"open": "09:00", "close": "22:00", "closed": false}, "monday": {"open": "09:00", "close": "22:00", "closed": false}, "sunday": {"open": "09:00", "close": "23:00", "closed": false}, "tuesday": {"open": "09:00", "close": "22:00", "closed": false}, "saturday": {"open": "09:00", "close": "23:00", "closed": false}, "thursday": {"open": "09:00", "close": "22:00", "closed": false}, "wednesday": {"open": "09:00", "close": "22:00", "closed": false}}'::jsonb,
  constraint restaurants_pkey primary key (id),
  constraint restaurants_owner_id_key unique (owner_id)
) TABLESPACE pg_default;

create index IF not exists idx_restaurants_owner on public.restaurants using btree (owner_id) TABLESPACE pg_default;

create trigger update_restaurants_updated_at BEFORE
update on restaurants for EACH row
execute FUNCTION update_updated_at_column ();


create table public.profiles (
  id uuid not null,
  full_name text null,
  phone text null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.menu_sections (
  id uuid not null default gen_random_uuid (),
  restaurant_id uuid not null,
  owner_id uuid not null,
  name text not null,
  description text null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint menu_sections_pkey primary key (id),
  constraint menu_sections_restaurant_id_fkey foreign KEY (restaurant_id) references restaurants (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_menu_sections_restaurant on public.menu_sections using btree (restaurant_id) TABLESPACE pg_default;

create index IF not exists idx_menu_sections_owner on public.menu_sections using btree (owner_id) TABLESPACE pg_default;

create trigger update_menu_sections_updated_at BEFORE
update on menu_sections for EACH row
execute FUNCTION update_updated_at_column ();


create table public.menu_items (
  id uuid not null default gen_random_uuid (),
  section_id uuid not null,
  owner_id uuid not null,
  name text not null,
  description text null,
  price numeric(10, 2) not null default 0,
  image_url text null,
  is_available boolean not null default true,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint menu_items_pkey primary key (id),
  constraint menu_items_section_id_fkey foreign KEY (section_id) references menu_sections (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_menu_items_section on public.menu_items using btree (section_id) TABLESPACE pg_default;

create index IF not exists idx_menu_items_owner on public.menu_items using btree (owner_id) TABLESPACE pg_default;

create trigger update_menu_items_updated_at BEFORE
update on menu_items for EACH row
execute FUNCTION update_updated_at_column ();


create table public.favorite_restaurants (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  restaurant_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint favorite_restaurants_pkey primary key (id),
  constraint favorite_restaurants_user_id_restaurant_id_key unique (user_id, restaurant_id),
  constraint favorite_restaurants_restaurant_id_fkey foreign KEY (restaurant_id) references restaurants (id) on delete CASCADE,
  constraint favorite_restaurants_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_favorite_restaurants_user_id on public.favorite_restaurants using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_favorite_restaurants_restaurant_id on public.favorite_restaurants using btree (restaurant_id) TABLESPACE pg_default;



create table public.favorite_menu_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  menu_item_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint favorite_menu_items_pkey primary key (id),
  constraint favorite_menu_items_user_id_menu_item_id_key unique (user_id, menu_item_id),
  constraint favorite_menu_items_menu_item_id_fkey foreign KEY (menu_item_id) references menu_items (id) on delete CASCADE,
  constraint favorite_menu_items_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_favorite_menu_items_user_id on public.favorite_menu_items using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_favorite_menu_items_menu_item_id on public.favorite_menu_items using btree (menu_item_id) TABLESPACE pg_default;