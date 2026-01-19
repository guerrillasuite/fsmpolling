// lib/db/init.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'surveys.db');

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function initializeDatabase() {
  ensureDataDirectory();
  const db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create surveys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create questions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options TEXT,
      required BOOLEAN DEFAULT 1,
      order_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `);
  
  // Create responses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crm_contact_id TEXT NOT NULL,
      survey_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_value TEXT NOT NULL,
      answer_text TEXT,
      original_position INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);
  
  // Create survey_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crm_contact_id TEXT NOT NULL,
      survey_id TEXT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      last_question_answered TEXT,
      UNIQUE(crm_contact_id, survey_id)
    )
  `);
  
  // Create contacts table for dial lists
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create dial_lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dial_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      survey_id TEXT,
      active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL
    )
  `);
  
  // Create dial_list_contacts junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dial_list_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      call_result TEXT,
      notes TEXT,
      called_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(list_id, contact_id),
      FOREIGN KEY (list_id) REFERENCES dial_lists(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);
  
  // Create call_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT NOT NULL,
      list_id TEXT,
      survey_id TEXT,
      result TEXT NOT NULL,
      notes TEXT,
      duration_seconds INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (list_id) REFERENCES dial_lists(id) ON DELETE SET NULL,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL
    )
  `);
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_responses_contact ON responses(crm_contact_id);
    CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id);
    CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_contact ON survey_sessions(crm_contact_id);
    CREATE INDEX IF NOT EXISTS idx_dial_list_contacts_list ON dial_list_contacts(list_id);
    CREATE INDEX IF NOT EXISTS idx_dial_list_contacts_status ON dial_list_contacts(status);
    CREATE INDEX IF NOT EXISTS idx_call_logs_contact ON call_logs(contact_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_list ON call_logs(list_id);
  `);
  
  db.close();
  console.log('Database initialized successfully');
}

export function getDatabase() {
  ensureDataDirectory();
  const db = new Database(DB_PATH);
  // Enable WAL mode for better concurrency (better than default)
  db.pragma('journal_mode = WAL');
  return db;
}

export function seedLNCChairPoll() {
  const db = getDatabase();

  try {
    const existing = db.prepare('SELECT id FROM surveys WHERE id = ?').get('lnc-chair-2025');

    if (!existing) {
      db.prepare(`
        INSERT INTO surveys (id, title, description, active)
        VALUES (?, ?, ?, ?)
      `).run(
        'lnc-chair-2025',
        'LNC Chair Race Poll',
        'If the National Convention was today, who would you vote for in the First Ballot of the LNC Chair Race?',
        1
      );

      const questions = [
        {
          id: 'lnc-chair-q1',
          text: 'If the National Convention was today, who would you vote for in the First Ballot of the LNC Chair Race?',
          type: 'multiple_choice_with_other',
          options: ['Evan McMahon', 'Rob Yates', 'Wes Benedict', 'Jim Ostrowski', 'Undecided'],
          required: 1,
          order: 1
        },
        {
          id: 'lnc-chair-q2',
          text: 'Would you support the following Amendment to the National Bylaws?',
          type: 'multiple_choice',
          options: ['Yes', 'No', 'Undecided'],
          required: 1,
          order: 2
        },
        {
          id: 'lnc-chair-q3',
          text: 'What brought you into the Libertarian Party?',
          type: 'multiple_choice_with_other',
          options: ['Candidate', 'Booth', 'Friend/Family', 'Podcast', 'Single Issue Group'],
          required: 1,
          order: 3
        },
        {
          id: 'lnc-chair-q4',
          text: 'What are your top 3 political issues?',
          type: 'multiple_select_with_other',
          options: ['Gun Rights', 'Taxation', 'Immigration', 'Drug Prohibition', 'GSM Issues', 'Foreign Policy', 'Renewable Energy', 'Infrastructure', 'Healthcare', 'Following the Constitution'],
          required: 1,
          order: 4
        },
        {
          id: 'lnc-chair-q5',
          text: 'Who did you vote for in the 2024 General Election?',
          type: 'multiple_choice_with_other',
          options: ['Donald Trump', 'Kamala Harris', 'Chase Oliver', 'RFK Jr.', 'Jill Stein', 'Didn\'t Vote'],
          required: 1,
          order: 5
        },
        {
          id: 'lnc-chair-q6',
          text: 'How long have you been an active member of the Libertarian Party?',
          type: 'multiple_choice',
          options: ['<1 Year', '1-5 Years', '5-10 Years', '10-20 Years', '20+ Years'],
          required: 1,
          order: 6
        },
        {
          id: 'lnc-chair-q7',
          text: 'What could the National Party do to get you to be a donor or donate more?',
          type: 'multiple_choice_with_other',
          options: ['More/Better Outreach', 'More/Better Candidates', 'More Lobbying', 'More Infrastructure'],
          required: 1,
          order: 7
        },
        {
          id: 'lnc-chair-q8',
          text: 'Please verify your contact information:',
          type: 'contact_verification',
          options: null,
          required: 0,
          order: 8
        }
      ];

      const insertQuestion = db.prepare(`
        INSERT INTO questions (id, survey_id, question_text, question_type, options, required, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const q of questions) {
        insertQuestion.run(
          q.id,
          'lnc-chair-2025',
          q.text,
          q.type,
          q.options ? JSON.stringify(q.options) : null,
          q.required,
          q.order
        );
      }

      console.log('LNC Chair poll seeded successfully');
    }
  } finally {
    db.close();
  }
}

export function seedSampleDialList() {
  const db = getDatabase();
  
  try {
    // Check if sample data exists
    const existingList = db.prepare('SELECT id FROM dial_lists WHERE id = ?').get('sample-list-1');
    
    if (!existingList) {
      // Create sample contacts
      const contacts = [
        { id: 'contact-1', first_name: 'John', last_name: 'Smith', phone: '555-0101' },
        { id: 'contact-2', first_name: 'Jane', last_name: 'Doe', phone: '555-0102' },
        { id: 'contact-3', first_name: 'Bob', last_name: 'Johnson', phone: '555-0103' },
      ];
      
      const insertContact = db.prepare(`
        INSERT INTO contacts (id, first_name, last_name, phone)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const contact of contacts) {
        insertContact.run(contact.id, contact.first_name, contact.last_name, contact.phone);
      }
      
      // Create sample dial list linked to LNC poll
      db.prepare(`
        INSERT INTO dial_lists (id, name, description, survey_id, active)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'sample-list-1',
        'LNC Poll Dial List',
        'Sample contacts for LNC Chair polling',
        'lnc-chair-2025',
        1
      );
      
      // Add contacts to list
      const insertListContact = db.prepare(`
        INSERT INTO dial_list_contacts (list_id, contact_id, status)
        VALUES (?, ?, ?)
      `);
      
      for (const contact of contacts) {
        insertListContact.run('sample-list-1', contact.id, 'pending');
      }
      
      console.log('Sample dial list seeded successfully');
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  initializeDatabase();
  seedLNCChairPoll();
  seedSampleDialList();
}