require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const User = require('./models/User');
const Partner = require('./models/Partner');
const Shipment = require('./models/Shipment');
const Invoice = require('./models/Invoice');
const Notification = require('./models/Notification');
const SupportTicket = require('./models/SupportTicket');
const PricingRule = require('./models/PricingRule');
const Address = require('./models/Address');
const { seedDatabase } = require('./seedData');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipflow';
const JWT_SECRET = process.env.JWT_SECRET || 'shipflow-college-demo-secret-change-me';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

const hashPassword = (password) => crypto.createHash('sha256').update(String(password)).digest('hex');
const safeUser = (u) => ({
  userId: u.userId, name: u.name, company: u.company, email: u.email, phone: u.phone,
  role: u.role, accountNo: u.accountNo, kycStatus: u.kycStatus, balance: u.balance, createdAt: u.createdAt
});

// Small signed session token for the college demo. No external JWT dependency is required.
const createToken = (user) => {
  const payload = Buffer.from(JSON.stringify({ userId: user.userId, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

const verifyToken = (token) => {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.userId || !data.exp || Date.now() > data.exp) return null;
    return data;
  } catch (_) { return null; }
};

const auth = (roles = []) => async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const user = verifyToken(token);
  // The existing college UI supports a no-login demo mode. If a token is supplied, it is always verified.
  if (token && !user) return res.status(401).json({ success: false, message: 'Session expired or invalid' });
  if (roles.length && user && !roles.includes(user.role)) return res.status(403).json({ success: false, message: 'Role not permitted' });
  req.user = user;
  next();
};

const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SHIPMENT_STATUSES = ['Created', 'Confirmed', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
const STATUS_INDEX = Object.fromEntries(SHIPMENT_STATUSES.map((status, index) => [status, index]));

function buildLifecycleTimeline(status, existing = []) {
  const legacyToNew = {
    'Shipment Created': 'Created',
    'Pickup Scheduled': 'Confirmed',
    'Picked Up': 'Picked Up',
    'In Transit': 'In Transit',
    'Out for Delivery': 'Out for Delivery',
    'Delivered': 'Delivered'
  };
  const old = new Map((existing || []).map(item => [legacyToNew[item.milestone] || item.milestone, item]));
  const effective = status === 'Pending' ? 'Created' : status;
  const currentIndex = effective === 'Cancelled' ? -1 : (STATUS_INDEX[effective] ?? 0);
  return SHIPMENT_STATUSES.map((milestone, index) => {
    const oldItem = old.get(milestone);
    const done = effective !== 'Cancelled' && index <= currentIndex;
    return {
      milestone,
      time: done ? (oldItem?.time && oldItem.time !== 'Pending' ? oldItem.time : (index === 0 ? 'Just now' : 'Pending')) : 'Pending',
      location: oldItem?.location || (milestone === 'Created' ? 'ShipFlow Shipper Portal' : '-'),
      done
    };
  });
}

async function migrateShipmentLifecycle() {
  const shipments = await Shipment.find({});
  for (const shipment of shipments) {
    const normalizedStatus = shipment.status === 'Pending' ? 'Created' : shipment.status;
    const nextTimeline = buildLifecycleTimeline(normalizedStatus, shipment.timeline);
    const timelineChanged = JSON.stringify(shipment.timeline || []) !== JSON.stringify(nextTimeline);
    if (shipment.status !== normalizedStatus || timelineChanged) {
      shipment.status = normalizedStatus;
      shipment.timeline = nextTimeline;
      await shipment.save();
    }
  }
}

let mongoConnected = false;

async function ensureSeeded() {
  const shipmentCount = await Shipment.countDocuments();
  if (shipmentCount === 0) {
    console.log('⚡ Empty database detected. Seeding ShipFlow demo data...');
    await seedDatabase({ manageConnection: false });
  }
}

async function migratePlaintextPasswords() {
  const users = await User.find({}).select('+password');
  for (const user of users) {
    if (user.password && !/^[a-f0-9]{64}$/i.test(user.password)) {
      user.password = hashPassword(user.password);
      await user.save();
    }
  }
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    mongoConnected = true;
    console.log(`✅ [MongoDB] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    await ensureSeeded();
    await migratePlaintextPasswords();
    await migrateShipmentLifecycle();
  })
  .catch(err => {
    mongoConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
    console.info('💡 Start MongoDB or set MONGODB_URI in server/.env');
  });

app.get('/api/health', (req, res) => res.json({
  status: 'online', service: 'ShipFlow Logistics API', timestamp: new Date().toISOString(),
  mongodb: { connected: mongoose.connection.readyState === 1, readyState: mongoose.connection.readyState, host: mongoose.connection.host || 'unknown', database: mongoose.connection.name || 'shipflow' }
}));

app.get('/api/state', async (req, res) => {
  try {
    const [users, partners, shipments, pricing, notifications, tickets, addresses] = await Promise.all([
      User.find({}).select('-password'), Partner.find({}), Shipment.find({}).sort({ createdAt: -1 }),
      PricingRule.findOne({ ruleId: 'global_rate_card' }), Notification.find({}).sort({ createdAt: -1 }),
      SupportTicket.find({}).sort({ createdAt: -1 }), Address.find({})
    ]);
    const currentUser = req.user ? users.find(u => u.userId === req.user.userId) : users.find(u => u.role === 'shipper') || users[0];
    res.json({ success: true, currentUser, partners, shipments, pricingRules: pricing, notifications, supportTickets: tickets, savedAddresses: addresses });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || hashPassword(password) !== user.password) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (role && user.role !== role) return res.status(403).json({ success: false, message: `This account is registered as ${user.role}` });
    const token = createToken(user);
    res.json({ success: true, message: 'Authenticated successfully', token, user: safeUser(user) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, company, email, phone, password, role, vehicle } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters' });
    const normalizedEmail = email.toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: 'Email already registered' });
    const userRole = ['shipper', 'partner'].includes(role) ? role : 'shipper';
    const newUser = await User.create({ name, company: company || (userRole === 'partner' ? 'ShipFlow Driver Fleet' : 'Independent'), email: normalizedEmail, phone, password: hashPassword(password), role: userRole, kycStatus: 'Verified' });
    if (userRole === 'partner') {
      await Partner.create({ partnerId: id('drv'), name, email: normalizedEmail, phone, vehicle: vehicle || 'Standard Courier Van', status: 'Online' });
    }
    const token = createToken(newUser);
    res.status(201).json({ success: true, token, user: safeUser(newUser) });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.get('/api/auth/me', auth(), async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Login required' });
  const user = await User.findOne({ userId: req.user.userId }).select('-password');
  res.json({ success: true, user });
});

// Shipments
app.get('/api/shipments', async (req, res) => {
  try {
    const { status, search, assignedPartnerId } = req.query; const query = {};
    if (status && status !== 'all') query.status = status;
    if (assignedPartnerId) query.assignedPartnerId = assignedPartnerId;
    if (search) query.$or = [{ id: { $regex: search, $options: 'i' } }, { 'destination.name': { $regex: search, $options: 'i' } }, { 'destination.address': { $regex: search, $options: 'i' } }];
    const shipments = await Shipment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.get('/api/shipments/:id', async (req, res) => {
  try { const shipment = await Shipment.findOne({ id: req.params.id }); if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' }); res.json({ success: true, data: shipment }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
app.post('/api/shipments', auth(['shipper', 'admin']), async (req, res) => {
  try {
    const shipmentData = { ...req.body, id: req.body.id || 'SF-' + Math.floor(100000 + Math.random() * 900000) };
    shipmentData.invoiceId = shipmentData.invoiceId || 'INV-2026-' + shipmentData.id.replace('SF-', '');
    shipmentData.assignedPartnerId = null;
    shipmentData.status = 'Confirmed';
    shipmentData.timeline = buildLifecycleTimeline('Confirmed', shipmentData.timeline);
    const created = await Shipment.create(shipmentData);
    const total = Number(created.pricing?.total || 0);
    await Invoice.findOneAndUpdate({ invoiceId: created.invoiceId }, { invoiceId: created.invoiceId, shipmentId: created.id, consignor: created.origin, consignee: created.destination, lineItems: [{ description: created.package?.description || 'Shipment service', amount: total }], totalAmount: total, paymentStatus: 'PENDING' }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await Notification.create({ userId: req.user?.userId || 'usr_shipper_01', title: 'Shipment Booked & Confirmed', message: `Shipment ${created.id} was saved to MongoDB.`, type: 'success', time: 'Just now' });
    res.status(201).json({ success: true, data: created });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
app.put('/api/shipments/:id/status', auth(['shipper', 'partner', 'admin']), async (req, res) => {
  try {
    const { status, milestoneTime, location } = req.body;
    if (!SHIPMENT_STATUSES.includes(status) && status !== 'Cancelled') return res.status(400).json({ success: false, message: `Invalid shipment status. Use: ${SHIPMENT_STATUSES.join(', ')}` });
    const shipment = await Shipment.findOne({ id: req.params.id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    const current = shipment.status === 'Pending' ? 'Created' : shipment.status;
    if (status !== 'Cancelled' && current !== 'Cancelled' && STATUS_INDEX[status] < (STATUS_INDEX[current] ?? 0)) {
      return res.status(409).json({ success: false, message: `Shipment cannot move backward from ${current} to ${status}.` });
    }
    shipment.status = status;
    shipment.timeline = buildLifecycleTimeline(status, shipment.timeline);
    const entry = shipment.timeline.find(t => t.milestone === status);
    if (entry && status !== 'Cancelled') {
      entry.done = true;
      entry.time = milestoneTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (location) entry.location = location;
    }
    if (status === 'Delivered') { shipment.eta = 'Delivered'; shipment.distanceRemainingKm = 0; }
    await shipment.save();
    await Notification.create({ userId: req.user?.userId || 'usr_shipper_01', title: `Status: ${status}`, message: `Shipment ${shipment.id} changed to ${status}.`, type: 'delivery', time: 'Just now' });
    res.json({ success: true, data: shipment });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
app.put('/api/shipments/:id/assign', auth(['admin', 'shipper']), async (req, res) => {
  try {
    const { partnerId } = req.body; const partner = await Partner.findOne({ partnerId });
    if (!partner) return res.status(404).json({ success: false, message: 'Driver not found' });
    const shipment = await Shipment.findOne({ id: req.params.id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    if (shipment.status === 'Delivered' || shipment.status === 'Cancelled') return res.status(409).json({ success: false, message: `Cannot assign a ${shipment.status.toLowerCase()} shipment.` });
    if ((STATUS_INDEX[shipment.status] ?? 0) > STATUS_INDEX.Assigned) return res.status(409).json({ success: false, message: `Shipment is already past the assignment stage (${shipment.status}).` });
    shipment.assignedPartnerId = partnerId;
    shipment.status = 'Assigned';
    shipment.timeline = buildLifecycleTimeline('Assigned', shipment.timeline);
    const assignedEntry = shipment.timeline.find(t => t.milestone === 'Assigned');
    if (assignedEntry) { assignedEntry.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); assignedEntry.location = partner.currentLocation || partner.name; }
    await shipment.save();
    partner.status = 'Busy'; await partner.save();
    await Notification.create({ userId: 'usr_shipper_01', title: 'Driver Assigned', message: `${partner.name} assigned to shipment ${shipment.id}.`, type: 'delivery', time: 'Just now' });
    res.json({ success: true, data: shipment });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
app.post('/api/shipments/:id/pod', auth(['partner', 'shipper', 'admin']), async (req, res) => {
  try {
    const { receiverName, signature, confirmationCode, photoUrl } = req.body; const shipment = await Shipment.findOne({ id: req.params.id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    if (!receiverName || !signature) return res.status(400).json({ success: false, message: 'Receiver name and signature are required' });
    shipment.status = 'Delivered'; shipment.eta = 'Delivered'; shipment.distanceRemainingKm = 0;
    shipment.pod = { receiverName, timestamp: new Date().toISOString(), signature, confirmationCode: confirmationCode || '4821', photoUrl };
    shipment.timeline.forEach(t => t.done = true); await shipment.save();
    if (shipment.invoiceId) await Invoice.findOneAndUpdate({ invoiceId: shipment.invoiceId }, { paymentStatus: 'PAID' });
    res.json({ success: true, message: 'Proof of Delivery saved in MongoDB', data: shipment });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

// Partners / drivers
app.get('/api/partners', async (req, res) => { try { res.json({ success: true, data: await Partner.find({}).sort({ createdAt: -1 }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.post('/api/partners', auth(['admin']), async (req, res) => { try { const p = await Partner.create({ ...req.body, partnerId: req.body.partnerId || id('drv') }); res.status(201).json({ success: true, data: p }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });
app.put('/api/partners/:id', auth(['admin', 'partner']), async (req, res) => { try { const p = await Partner.findOneAndUpdate({ partnerId: req.params.id }, req.body, { new: true, runValidators: true }); if (!p) return res.status(404).json({ success: false, message: 'Driver not found' }); res.json({ success: true, data: p }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });

// Addresses
app.get('/api/addresses', async (req, res) => { try { const q = req.query.userId ? { userId: req.query.userId } : {}; res.json({ success: true, data: await Address.find(q).sort({ isDefault: -1, createdAt: -1 }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.post('/api/addresses', auth(['shipper', 'admin']), async (req, res) => { try { const userId = req.user?.userId || req.body.userId || 'usr_shipper_01'; if (req.body.isDefault) await Address.updateMany({ userId }, { isDefault: false }); const a = await Address.create({ ...req.body, userId }); res.status(201).json({ success: true, data: a }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });
app.put('/api/addresses/:id', auth(['shipper', 'admin']), async (req, res) => { try { const a = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!a) return res.status(404).json({ success: false, message: 'Address not found' }); res.json({ success: true, data: a }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });
app.delete('/api/addresses/:id', auth(['shipper', 'admin']), async (req, res) => { try { const a = await Address.findByIdAndDelete(req.params.id); if (!a) return res.status(404).json({ success: false, message: 'Address not found' }); res.json({ success: true, message: 'Address deleted' }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });

// Invoices
app.get('/api/invoices', async (req, res) => { try { const q = req.query.shipmentId ? { shipmentId: req.query.shipmentId } : {}; res.json({ success: true, data: await Invoice.find(q).sort({ createdAt: -1 }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.get('/api/invoices/:id', async (req, res) => { try { const i = await Invoice.findOne({ invoiceId: req.params.id }); if (!i) return res.status(404).json({ success: false, message: 'Invoice not found' }); res.json({ success: true, data: i }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.put('/api/invoices/:id/status', auth(['admin', 'shipper']), async (req, res) => { try { const i = await Invoice.findOneAndUpdate({ invoiceId: req.params.id }, { paymentStatus: req.body.paymentStatus }, { new: true, runValidators: true }); if (!i) return res.status(404).json({ success: false, message: 'Invoice not found' }); res.json({ success: true, data: i }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });

// Pricing
app.get('/api/pricing', async (req, res) => { try { res.json({ success: true, data: await PricingRule.findOne({ ruleId: 'global_rate_card' }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.put('/api/pricing', auth(['admin']), async (req, res) => { try { const updated = await PricingRule.findOneAndUpdate({ ruleId: 'global_rate_card' }, { ...req.body, updatedAt: Date.now() }, { new: true, upsert: true, runValidators: true }); res.json({ success: true, data: updated }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });

// Notifications
app.get('/api/notifications', async (req, res) => { try { const q = req.query.userId ? { userId: req.query.userId } : {}; res.json({ success: true, data: await Notification.find(q).sort({ createdAt: -1 }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.put('/api/notifications/read-all', auth(), async (req, res) => { try { const q = req.user ? { userId: req.user.userId } : {}; await Notification.updateMany(q, { read: true }); res.json({ success: true, message: 'Notifications marked as read' }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });

// Tickets
app.get('/api/tickets', async (req, res) => { try { res.json({ success: true, data: await SupportTicket.find({}).sort({ createdAt: -1 }) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });
app.post('/api/tickets', auth(['shipper', 'partner', 'admin']), async (req, res) => { try { const created = await SupportTicket.create({ ...req.body, id: req.body.id || 'TCK-' + Math.floor(4000 + Math.random() * 900) }); res.status(201).json({ success: true, data: created }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });
app.put('/api/tickets/:id', auth(['shipper', 'partner', 'admin']), async (req, res) => { try { const updated = await SupportTicket.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true }); if (!updated) return res.status(404).json({ success: false, message: 'Ticket not found' }); res.json({ success: true, data: updated }); } catch (e) { res.status(400).json({ success: false, error: e.message }); } });

app.post('/api/seed', async (req, res) => { try { await seedDatabase({ manageConnection: false }); res.json({ success: true, message: 'Database reset & seeded successfully' }); } catch (e) { res.status(500).json({ success: false, error: e.message }); } });

app.get('*', (req, res, next) => { if (req.path.startsWith('/api/')) return next(); res.sendFile(path.join(__dirname, '..', 'index.html')); });

app.listen(PORT, () => console.log(`🚀 ShipFlow running at http://localhost:${PORT} | MongoDB: ${MONGODB_URI}`));
