import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

type DatabaseType = InstanceType<typeof Database>;

const dbPath = path.join(process.cwd(), 'db', 'shyftoff.db');

let dbInstance: DatabaseType | null = null;

function ensureDirectory() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeSchema(db: DatabaseType) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS agent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign_agent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(agent_id, campaign_id),
      FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE,
      FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_kpi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      hours_worked REAL NOT NULL,
      work_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE
    );
  `);
}

function seedData(db: DatabaseType) {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM agent').get() as { count: number };
  if (count > 0) {
    return;
  }

  const sampleAgents = [
    { first: 'Alice', last: 'Johnson', email: 'alice.johnson@example.com' },
    { first: 'Bob', last: 'Smith', email: 'bob.smith@example.com' },
    { first: 'Charlie', last: 'Brown', email: 'charlie.brown@example.com' },
    { first: 'Diana', last: 'Prince', email: 'diana.prince@example.com' },
    { first: 'Ethan', last: 'Taylor', email: 'ethan.taylor@example.com' },
  ];

  const insertAgent = db.prepare(
    'INSERT INTO agent (first_name, last_name, email, is_active) VALUES (?, ?, ?, ?)'
  );
  const agentIds: number[] = [];
  for (const agent of sampleAgents) {
    const result = insertAgent.run(agent.first, agent.last, agent.email, 1);
    agentIds.push(Number(result.lastInsertRowid));
  }

  const sampleCampaigns = [
    { name: 'Summer Sale', description: 'Seasonal promotion for summer products' },
    { name: 'Winter Promo', description: 'Holiday preparation and upsell' },
    { name: 'Retention Push', description: 'Upsell campaign for premium customers' },
  ];

  const insertCampaign = db.prepare(
    'INSERT INTO campaign (name, description, is_active) VALUES (?, ?, ?)'
  );
  const campaignIds: number[] = [];
  for (const campaign of sampleCampaigns) {
    const result = insertCampaign.run(campaign.name, campaign.description, 1);
    campaignIds.push(Number(result.lastInsertRowid));
  }

  const insertAssignment = db.prepare(
    'INSERT INTO campaign_agent (agent_id, campaign_id) VALUES (?, ?)'
  );
  agentIds.forEach((agentId, idx) => {
    const campaignId = campaignIds[idx % campaignIds.length];
    insertAssignment.run(agentId, campaignId);
  });

  const insertKpi = db.prepare(
    'INSERT INTO campaign_kpi (campaign_id, agent_id, hours_worked, work_date) VALUES (?, ?, ?, ?)'
  );
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    agentIds.forEach((agentId, idx) => {
      const campaignId = campaignIds[idx % campaignIds.length];
      const hours = Number((Math.random() * 4 + 4).toFixed(2));
      insertKpi.run(campaignId, agentId, hours, dateStr);
    });
  }
}

function ensureDatabase() {
  ensureDirectory();

  const isNewDatabase = !fs.existsSync(dbPath);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initializeSchema(db);

  if (isNewDatabase) {
    seedData(db);
  } else {
    // Even if the file exists, ensure we have at least some data
    seedData(db);
  }

  return db;
}

export function getDb(): DatabaseType {
  if (!dbInstance) {
    dbInstance = ensureDatabase();
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

