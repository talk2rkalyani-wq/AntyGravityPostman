const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize DB asynchronously without blocking top-level
db.initDb().catch(console.error);

app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.post('/api/proxy', async (req, res) => {
  const { url, method, headers, auth, data } = req.body;

  if (!url || !method) {
    return res.status(400).json({ error: 'URL and Method are required.' });
  }

  const axiosConfig = {
    url,
    method,
    headers: headers || {},
    data: data || undefined,
    validateStatus: () => true,
  };

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

  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader) {
     const token = authHeader.split(' ')[1];
     if (token) {
        try {
           const user = await db.getUserBySession(token);
           if (user) userId = user.id;
        } catch(e) {}
     }
  }

  const startTime = Date.now();

  try {
    const response = await axios(axiosConfig);
    const endTime = Date.now();
    
    // Save to History (Fire and forget, but handle exception)
    if (userId) {
       db.saveHistory({
         url, method, status: response.status, time: endTime - startTime, userId
       }).catch(console.error);
    }

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

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const user = await db.getUserBySession(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error during auth' });
  }
};

const checkWorkspaceAccess = async (userId, workspaceId, requiredRole) => {
  if (workspaceId === 'default' || !workspaceId) return true;
  const member = await db.getWorkspaceMember(workspaceId, userId);
  const workspaces = await db.getWorkspaces(userId);
  const workspace = workspaces.find(w => w.id === workspaceId);
  if (workspace && workspace.owner_id === userId) return true;
  if (!member) return false;
  if (requiredRole === 'viewer') return true;
  if (requiredRole === 'editor' && (member.role === 'editor' || member.role === 'admin')) return true;
  if (requiredRole === 'admin' && member.role === 'admin') return true;
  return false;
};

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  const user = await db.getUserBySession(token);
  if (!user) return next(new Error('Invalid token'));
  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  socket.on('join_workspace', async (workspaceId) => {
    const hasAccess = await checkWorkspaceAccess(socket.user.id, workspaceId, 'viewer');
    if (!hasAccess) return;
    socket.rooms.forEach(r => r !== socket.id && socket.leave(r));
    socket.join(workspaceId);
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = await db.createUser(username, email, hash);
    const token = await db.createSession(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Username/Email and password are required' });
  
  try {
    const user = await db.getUserByEmailOrUsername(identifier);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = await db.createSession(user.id);
    res.json({ 
       user: { 
         id: user.id, 
         username: user.username, 
         email: user.email,
         first_name: user.first_name,
         last_name: user.last_name,
         contact_number: user.contact_number,
         role: user.role,
         timezone: user.timezone,
         profile_photo: user.profile_photo
       }, 
       token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    if (token) await db.deleteSession(token);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const updatedUser = await db.updateUserProfile(req.user.id, req.body);
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const user = await db.getUserByEmailOrUsername(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveOtp(user.email, otp);
    
    console.log(`\n==========================================`);
    console.log(`[SECURE EMAIL MOCK] OTP for ${user.email} is: ${otp}`);
    console.log(`==========================================\n`);
    
    res.json({ message: 'OTP sent successfully', _dev_otp: otp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  
  try {
    const resetToken = await db.verifyOtp(email, otp);
    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired OTP' });
    
    res.json({ resetToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    const isValid = await db.verifyResetToken(email, resetToken);
    if (!isValid) return res.status(400).json({ error: 'Invalid or expired reset session' });
    
    const hash = bcrypt.hashSync(newPassword, 10);
    await db.updatePasswordByEmail(email, hash);
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/history', requireAuth);
app.use('/api/collections', requireAuth);
app.use('/api/environments', requireAuth);
app.use('/api/members', requireAuth);
app.use('/api/workspaces', requireAuth);

app.get('/api/history', async (req, res) => {
  try { res.json(await db.getHistory(req.user.id)); } catch(e) { res.status(500).json({error:e.message}); }
});

app.get('/api/collections', async (req, res) => {
  const workspaceId = req.query.workspace || 'default';
  if (!(await checkWorkspaceAccess(req.user.id, workspaceId, 'viewer'))) return res.status(403).json({ error: 'Forbidden' });
  try { res.json(await db.getCollections(req.user.id, workspaceId)); } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/collections', async (req, res) => {
  const { name, data, workspace_id } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'Name and Data are required.' });
  const wId = workspace_id || 'default';
  if (!(await checkWorkspaceAccess(req.user.id, wId, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
  try { 
      const col = await db.createCollection(name, data, req.user.id, wId); 
      io.to(wId).emit('collection_update');
      res.status(201).json(col); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data is required.' });
  try { 
      const col = await db.getCollection(id);
      if(!col) return res.status(404).json({error: 'Not found'});
      if (!(await checkWorkspaceAccess(req.user.id, col.workspace_id, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
      const updated = await db.updateCollection(id, data); 
      io.to(col.workspace_id).emit('collection_update');
      res.json(updated); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  try { 
      const col = await db.getCollection(id);
      if(!col) return res.status(404).json({error: 'Not found'});
      if (!(await checkWorkspaceAccess(req.user.id, col.workspace_id, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
      await db.deleteCollection(id);
      io.to(col.workspace_id).emit('collection_update');
      res.json({ message: 'Collection deleted successfully' }); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/environments', async (req, res) => {
  const workspaceId = req.query.workspace || 'default';
  if (!(await checkWorkspaceAccess(req.user.id, workspaceId, 'viewer'))) return res.status(403).json({ error: 'Forbidden' });
  try { res.json(await db.getEnvironments(req.user.id, workspaceId)); } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/environments', async (req, res) => {
  const { name, data, workspace_id } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'Name and Data are required.' });
  const wId = workspace_id || 'default';
  if (!(await checkWorkspaceAccess(req.user.id, wId, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
  try { 
      const env = await db.createEnvironment(name, data, req.user.id, wId); 
      io.to(wId).emit('environment_update');
      res.status(201).json(env); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/environments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'Name and Data are required.' });
  try { 
      const env = await db.getEnvironment(id);
      if(!env) return res.status(404).json({error: 'Not found'});
      if (!(await checkWorkspaceAccess(req.user.id, env.workspace_id, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
      const updated = await db.updateEnvironment(id, name, data); 
      io.to(env.workspace_id).emit('environment_update');
      res.json(updated); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/environments/:id', async (req, res) => {
  const { id } = req.params;
  try { 
      const env = await db.getEnvironment(id);
      if(!env) return res.status(404).json({error: 'Not found'});
      if (!(await checkWorkspaceAccess(req.user.id, env.workspace_id, 'editor'))) return res.status(403).json({ error: 'Forbidden' });
      await db.deleteEnvironment(id); 
      io.to(env.workspace_id).emit('environment_update');
      res.status(204).send(); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/members', async (req, res) => {
  try { res.json(await db.getMembers()); } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/members', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and Email are required.' });
  try { res.status(201).json(await db.addMember({ name, email, role: role || 'READ ONLY' })); } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/members/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required.' });
  try { res.json(await db.updateMemberRole(id, role)); } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try { await db.removeMember(id); res.status(204).send(); } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/workspaces/:id/members', async (req, res) => {
  try {
     if (!(await checkWorkspaceAccess(req.user.id, req.params.id, 'viewer'))) return res.status(403).json({ error: 'Forbidden' });
     res.json(await db.getWorkspaceMembers(req.params.id));
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/workspaces/:id/members', async (req, res) => {
  try {
     if (!(await checkWorkspaceAccess(req.user.id, req.params.id, 'admin'))) return res.status(403).json({ error: 'Forbidden' });
     const { identifier, role } = req.body;
     const targetUser = await db.getUserByEmailOrUsername(identifier);
     if(!targetUser) return res.status(404).json({error: 'User not found'});
     await db.addWorkspaceMember(req.params.id, targetUser.id, role || 'viewer');
     io.to(req.params.id).emit('member_update');
     res.json({message: 'Added'});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/workspaces/:id/members/:userId/role', async (req, res) => {
  try {
     if (!(await checkWorkspaceAccess(req.user.id, req.params.id, 'admin'))) return res.status(403).json({ error: 'Forbidden' });
     await db.updateWorkspaceMemberRole(req.params.id, req.params.userId, req.body.role);
     io.to(req.params.id).emit('member_update');
     res.json({message: 'Updated'});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/workspaces/:id/members/:userId', async (req, res) => {
  try {
     if (!(await checkWorkspaceAccess(req.user.id, req.params.id, 'admin')) && req.user.id !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
     await db.removeWorkspaceMember(req.params.id, req.params.userId);
     io.to(req.params.id).emit('member_update');
     res.json({message: 'Removed'});
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/workspaces', async (req, res) => {
  try { res.json(await db.getWorkspaces(req.user.id)); } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/workspaces', async (req, res) => {
  const { name, type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try { 
      const wp = await db.addWorkspace(name, req.user.id, type || 'personal'); 
      res.status(201).json(wp); 
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/workspaces/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try { res.json(await db.updateWorkspace(req.params.id, name, req.user.id)); } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/workspaces/:id', async (req, res) => {
  try {
    const success = await db.deleteWorkspace(req.params.id, req.user.id);
    if (!success) return res.status(400).json({ error: 'Cannot delete default workspace' });
    res.status(204).send();
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
