require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    const query = `
      ALTER TABLE blogs 
      ADD COLUMN IF NOT EXISTS meta_title TEXT,
      ADD COLUMN IF NOT EXISTS meta_description TEXT,
      ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
      ADD COLUMN IF NOT EXISTS meta_schema TEXT,
      ADD COLUMN IF NOT EXISTS image_alt TEXT,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS faq_schema_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS custom_faq_schema TEXT,
      ADD COLUMN IF NOT EXISTS related_articles JSONB DEFAULT '[]';
    `;
    await client.query(query);
    console.log('Successfully updated blogs table');
  } catch (err) {
    console.error('Error updating table:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
