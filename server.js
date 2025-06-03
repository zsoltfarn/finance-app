import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new Database('db/finance.db', { verbose: console.log });

// User Registration Route
app.post('/api/register', async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user into the database
    const insert = db.prepare('INSERT INTO profiles (name, username, password_hash) VALUES (?, ?, ?)');
    const result = insert.run(name, username, password_hash);

    res.status(201).json({ message: 'User registered successfully!', userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: profiles.username')) {
      res.status(409).json({ message: 'Username already exists.' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
});

// User Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Retrieve user from database
    const user = db.prepare('SELECT * FROM profiles WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // In a real application, you would generate a JWT here and send it back
    res.status(200).json({ message: 'Login successful!', user: { id: user.id, name: user.name, username: user.username } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Add Income
app.post('/api/incomes', (req, res) => {
  const { profile_id, description, amount, date } = req.body;
  if (!profile_id || !description || !amount || !date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare('INSERT INTO incomes (profile_id, description, amount, date) VALUES (?, ?, ?, ?)');
    stmt.run(profile_id, description, amount, date);
    res.status(201).json({ message: 'Income added successfully' });
  } catch (error) {
    console.error('Error adding income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Incomes for a profile
app.get('/api/incomes/:profile_id', (req, res) => {
  const { profile_id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM incomes WHERE profile_id = ? ORDER BY date DESC');
    const incomes = stmt.all(profile_id);
    res.status(200).json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Outgoing
app.post('/api/outgoings', (req, res) => {
  const { profile_id, description, amount, date } = req.body;
  if (!profile_id || !description || !amount || !date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const stmt = db.prepare('INSERT INTO outgoings (profile_id, description, amount, date) VALUES (?, ?, ?, ?)');
    stmt.run(profile_id, description, amount, date);
    res.status(201).json({ message: 'Outgoing added successfully' });
  } catch (error) {
    console.error('Error adding outgoing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Outgoings for a profile
app.get('/api/outgoings/:profile_id', (req, res) => {
  const { profile_id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM outgoings WHERE profile_id = ? ORDER BY date DESC');
    const outgoings = stmt.all(profile_id);
    res.status(200).json(outgoings);
  } catch (error) {
    console.error('Error fetching outgoings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Income
app.delete('/api/incomes/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM incomes WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    res.status(200).json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Outgoing
app.delete('/api/outgoings/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM outgoings WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Outgoing record not found' });
    }
    res.status(200).json({ message: 'Outgoing record deleted successfully' });
  } catch (error) {
    console.error('Error deleting outgoing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});