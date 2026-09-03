import { Pool, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let cached: Promise<void> | undefined;

/**
 * The schema, created on boot so the app deploys into an empty database.
 *
 * Fees are integer pence. Photographs are stored as URLs rather than bytes:
 * this app has no blob store, and pretending otherwise would mean a database
 * full of base64 and a very slow gallery.
 */
export async function ensureSchema(): Promise<void> {
  if (!cached) {
    cached = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS studios (
        id serial primary key,
        code text unique not null,
        name text not null,
        created_at timestamptz not null default now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id serial primary key,
        studio_id integer not null references studios(id) on delete cascade,
        email text unique not null,
        name text not null default '',
        password_hash text not null,
        created_at timestamptz not null default now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS clients (
        id serial primary key,
        studio_id integer not null references studios(id) on delete cascade,
        name text not null,
        email text not null default '',
        created_at timestamptz not null default now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS shoots (
        id serial primary key,
        studio_id integer not null references studios(id) on delete cascade,
        client_id integer references clients(id) on delete set null,
        title text not null,
        kind text not null default 'portrait',
        shoot_date date,
        location text not null default '',
        status text not null default 'enquiry',
        fee_pence integer not null default 0,
        -- The gallery link. Unguessable and unique platform-wide: it is the
        -- only thing standing between a client's photographs and the internet.
        gallery_token text unique,
        created_at timestamptz not null default now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS shot_list (
        id serial primary key,
        shoot_id integer not null references shoots(id) on delete cascade,
        item text not null,
        done boolean not null default false,
        sort integer not null default 0)`);
      await pool.query(`CREATE TABLE IF NOT EXISTS photos (
        id serial primary key,
        shoot_id integer not null references shoots(id) on delete cascade,
        url text not null,
        caption text not null default '',
        sort integer not null default 0,
        created_at timestamptz not null default now())`);
      // A select is the client saying "this one". One per photo, so starring
      // twice is idempotent rather than a second row nobody can see.
      await pool.query(`CREATE TABLE IF NOT EXISTS selects (
        id serial primary key,
        photo_id integer not null references photos(id) on delete cascade,
        note text not null default '',
        created_at timestamptz not null default now(),
        unique (photo_id))`);
      await pool.query(`CREATE INDEX IF NOT EXISTS shoots_studio_idx ON shoots (studio_id, shoot_date)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS photos_shoot_idx ON photos (shoot_id, sort)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS shotlist_shoot_idx ON shot_list (shoot_id, sort)`);
    })().catch((err) => {
      cached = undefined;
      throw err;
    });
  }
  return cached;
}

export async function query<T extends QueryResultRow>(sql: string, params?: unknown[]): Promise<T[]> {
  await ensureSchema();
  const { rows } = await pool.query<T>(sql, params);
  return rows;
}

export async function tx<T>(run: (q: (sql: string, params?: unknown[]) => Promise<QueryResultRow[]>) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await run(async (sql, params) => (await client.query(sql, params)).rows);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
