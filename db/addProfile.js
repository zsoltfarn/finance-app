import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'finance.db');
const db = new Database(dbPath);

function addProfile(name) {
  try {
    const insert = db.prepare('INSERT INTO profiles (name) VALUES (?)');
    const result = insert.run(name);
    console.log(`Profile '${name}' added with ID: ${result.lastInsertRowid}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.error(`Error: Profile with name '${name}' already exists.`);
    } else {
      console.error('Error adding profile:', error.message);
    }
  }
}

// Example usage:
const profileName = process.argv[2]; // Get profile name from command line argument

if (!profileName) {
  console.log('Usage: node db/addProfile.js <profile_name>');
} else {
  addProfile(profileName);
}

// Close the database connection when done (optional for simple scripts)
// db.close();