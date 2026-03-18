const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize SQLite DB
db.initDb();

// Add global middleware to bypass localtunnel reminder page for static assets
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// --- Proxy Endpoint ---
app.post('/api/proxy', async (req, res) => {
  const { url, method, headers, auth, data } = req.body;

  if (!url || !method) {
    return res.status(400).json({ error: 'URL and Method are required.' });
  }

  // Construct Axios config
  const axiosConfig = {
    url,
    method,
    headers: headers || {},
    data: data || undefined,
    validateStatus: () => true, // Don't throw errors for non-2xx status codes
  };

  // Optional: Handle Auth (Basic, Bearer, etc.) if provided separately from headers
  if (auth && auth.type) {
    if (auth.type === 'bearer' && auth.token) {
      axiosConfig.headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'basic' && auth.username && auth.password) {
      axiosConfig.auth = {
        username: auth.username,
        password: auth.password
      };
    }
  }

  const startTime = Date.now();

  try {
    const response = await axios(axiosConfig);
    const endTime = Date.now();
    
    // Save to History (Fire and forget)
    db.saveHistory({
      url,
      method,
      status: response.status,
      time: endTime - startTime
    });

    // Send response back to frontend
    res.status(response.status).json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time: endTime - startTime,
      size: JSON.stringify(response.data)?.length || 0 
    });

  } catch (error) {
    const endTime = Date.now();
    res.status(500).json({
      error: error.message,
      time: endTime - startTime,
      status: 0,
      statusText: 'Error'
    });
  }
});

// --- Auth Middleware ---
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.getUserBySession(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
  req.user = user;
  next();
};

// --- Auth Endpoints ---
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = db.createUser(username, email, hash);
    const token = db.createSession(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username
  if (!identifier || !password) return res.status(400).json({ error: 'Username/Email and password are required' });
  
  const user = db.getUserByEmailOrUsername(identifier);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = db.createSession(user.id);
  res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) db.deleteSession(token);
  res.json({ success: true });
});

// --- Password Reset Endpoints ---
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const user = db.getUserByEmailOrUsername(email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  db.saveOtp(user.email, otp);
  
  console.log(`\n==========================================`);
  console.log(`[SECURE EMAIL MOCK] OTP for ${user.email} is: ${otp}`);
  console.log(`==========================================\n`);
  
  // Returning the OTP just so the user can test the UI easily without a real SMTP setup
  res.json({ message: 'OTP sent successfully', _dev_otp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  
  const resetToken = db.verifyOtp(email, otp);
  if (!resetToken) return res.status(400).json({ error: 'Invalid or expired OTP' });
  
  res.json({ resetToken });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) return res.status(400).json({ error: 'Missing required fields' });
  
  const isValid = db.verifyResetToken(email, resetToken);
  if (!isValid) return res.status(400).json({ error: 'Invalid or expired reset session' });
  
  const hash = bcrypt.hashSync(newPassword, 10);
  db.updatePasswordByEmail(email, hash);
  
  res.json({ success: true });
});

// --- Protected Routes Middleware ---
app.use('/api/history', requireAuth);
app.use('/api/collections', requireAuth);
app.use('/api/members', requireAuth);
app.use('/api/workspaces', requireAuth);

// --- History Endpoints ---
app.get('/api/history', (req, res) => {
  const history = db.getHistory();
  res.json(history);
});

// --- Collections Endpoints ---
app.get('/api/collections', (req, res) => {
  const collections = db.getCollections();
  res.json(collections);
});

app.post('/api/collections', (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) {
    return res.status(400).json({ error: 'Name and Data are required.' });
  }
  const collection = db.createCollection(name, data);
  res.status(201).json(collection);
});

app.put('/api/collections/:id', (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data is required.' });
  const updated = db.updateCollection(id, data);
  res.json(updated);
});

// --- Members Endpoints ---
app.get('/api/members', (req, res) => {
  const members = db.getMembers();
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required.' });
  }
  const member = db.addMember({ name, email, role: role || 'READ ONLY' });
  res.status(201).json(member);
});

app.put('/api/members/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required.' });
  const updated = db.updateMemberRole(id, role);
  res.json(updated);
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  db.removeMember(id);
  res.status(204).send();
});

// --- Workspaces Endpoints ---
app.get('/api/workspaces', (req, res) => {
  res.json(db.getWorkspaces());
});

app.post('/api/workspaces', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.status(201).json(db.addWorkspace(name));
});

app.put('/api/workspaces/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.json(db.updateWorkspace(req.params.id, name));
});

app.delete('/api/workspaces/:id', (req, res) => {
  const success = db.deleteWorkspace(req.params.id);
  if (!success) return res.status(400).json({ error: 'Cannot delete default workspace' });
  res.status(204).send();
});

// Catch-all to serve React app for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
