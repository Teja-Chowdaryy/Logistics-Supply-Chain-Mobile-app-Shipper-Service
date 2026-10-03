require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('./models/User');
const Partner = require('./models/Partner');
const Shipment = require('./models/Shipment');
const Invoice = require('./models/Invoice');
const Notification = require('./models/Notification');
const SupportTicket = require('./models/SupportTicket');
const PricingRule = require('./models/PricingRule');
const Address = require('./models/Address');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipflow';

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const initialUsers = [
  {
    userId: 'usr_shipper_01',
    name: 'Alex Vance',
    company: 'Nexus Logistics Inc.',
    email: 'alex@nexuslogistics.com',
    phone: '+1 (415) 890-2341',
    role: 'shipper',
    password: hashPassword('shipper123'),
    accountNo: 'NL-8842-US',
    kycStatus: 'Verified',
    balance: 14500.00
  },
  {
    userId: 'usr_admin_01',
    name: 'Sarah Lin',
    company: 'ShipFlow Operations',
    email: 'admin@shipflow.com',
    phone: '+1 (800) 555-7447',
    role: 'admin',
    password: hashPassword('admin123'),
    accountNo: 'SF-HQ-01',
    kycStatus: 'Verified',
    balance: 250000.00
  },
  { userId: 'usr_partner_01', name: 'Marcus Cole', company: 'ShipFlow Driver Fleet', email: 'marcus.driver@shipflow.io', phone: '+1 (555) 349-8821', password: hashPassword('driver123'), role: 'partner', kycStatus: 'Verified' },
  { userId: 'usr_partner_02', name: 'Elena Rostova', company: 'ShipFlow Driver Fleet', email: 'elena.r@shipflow.io', phone: '+1 (555) 712-4099', password: hashPassword('driver123'), role: 'partner', kycStatus: 'Verified' },
  { userId: 'usr_partner_03', name: 'Devon Patel', company: 'ShipFlow Driver Fleet', email: 'devon.p@shipflow.io', phone: '+1 (555) 430-1120', password: hashPassword('driver123'), role: 'partner', kycStatus: 'Verified' }
];

const initialPartners = [
  {
    partnerId: 'drv_01',
    name: 'Marcus Cole',
    email: 'marcus.driver@shipflow.io',
    avatar: 'MC',
    phone: '+1 (555) 349-8821',
    vehicle: 'Ford Transit 350 (Plate: CA-8X92K)',
    vehicleType: 'Van',
    rating: 4.92,
    deliveriesCompleted: 342,
    todayEarnings: 248.50,
    status: 'Online',
    kycStatus: 'Approved',
    currentLocation: 'Mission District, San Francisco',
    coordinates: { x: 55, y: 58 }
  },
  {
    partnerId: 'drv_02',
    name: 'Elena Rostova',
    email: 'elena.r@shipflow.io',
    avatar: 'ER',
    phone: '+1 (555) 712-4099',
    vehicle: 'Mercedes Sprinter (Plate: WA-4M19Z)',
    vehicleType: 'Sprinter',
    rating: 4.88,
    deliveriesCompleted: 219,
    todayEarnings: 195.00,
    status: 'Online',
    kycStatus: 'Approved',
    currentLocation: 'Interstate 5 Northbound',
    coordinates: { x: 42, y: 48 }
  },
  {
    partnerId: 'drv_03',
    name: 'Devon Patel',
    email: 'devon.p@shipflow.io',
    avatar: 'DP',
    phone: '+1 (555) 430-1120',
    vehicle: 'Freightliner Box Truck (Plate: IL-9P23Q)',
    vehicleType: 'Box Truck',
    rating: 4.95,
    deliveriesCompleted: 580,
    todayEarnings: 310.00,
    status: 'Online',
    kycStatus: 'Approved',
    currentLocation: 'Chicago Metro Logistics Park',
    coordinates: { x: 18, y: 40 }
  }
];

const initialShipments = [
  {
    id: 'SF-892401',
    date: '2026-10-01 09:30',
    status: 'Out for Delivery',
    origin: {
      name: 'Nexus Silicon Valley Warehouse',
      address: '400 Logistics Blvd, San Francisco, CA',
      contact: 'Alex Vance (+1 415-890-2341)'
    },
    destination: {
      name: 'AeroTech Systems HQ',
      address: '1200 Innovation Way, San Jose, CA',
      contact: 'David Miller (+1 408-555-8922)'
    },
    package: {
      type: 'Fragile Goods',
      weight: 14.5,
      dimensions: '45 x 30 x 25 cm',
      quantity: 3,
      declaredValue: 2400,
      description: 'Precision Optic Sensors & Circuit Assemblies'
    },
    priority: 'express',
    pricing: {
      base: 25.0,
      weightCharge: 40.6,
      prioritySurcharge: 18.0,
      fuelSurcharge: 5.43,
      insurance: 36.0,
      tax: 6.25,
      total: 131.28
    },
    assignedPartnerId: 'drv_01',
    eta: '28 mins',
    distanceRemainingKm: 14.2,
    currentCoords: { x: 55, y: 58 },
    routeCoords: [
      { x: 20, y: 30, label: 'SF Hub' },
      { x: 38, y: 44, label: 'San Mateo Checkpoint' },
      { x: 55, y: 58, label: 'Current: Palo Alto Transit' },
      { x: 75, y: 72, label: 'Sunnyvale Distribution' },
      { x: 88, y: 82, label: 'San Jose Delivery' }
    ],
    timeline: [
      { milestone: 'Shipment Created', time: '08:15 AM', location: 'San Francisco Portal', done: true },
      { milestone: 'Pickup Scheduled', time: '08:45 AM', location: 'SF Warehouse Bay 4', done: true },
      { milestone: 'Picked Up', time: '09:20 AM', location: 'Driver Marcus Cole', done: true },
      { milestone: 'In Transit', time: '10:05 AM', location: 'Highway 101 South', done: true },
      { milestone: 'Out for Delivery', time: '11:15 AM', location: 'Palo Alto Tech Corridor', done: true },
      { milestone: 'Delivered', time: 'Pending', location: 'AeroTech Reception', done: false }
    ],
    pod: null,
    invoiceId: 'INV-2026-892401'
  },
  {
    id: 'SF-749120',
    date: '2026-10-01 07:15',
    status: 'In Transit',
    origin: {
      name: 'Pacific BioPharma Terminal',
      address: 'Terminal 18, Seattle Port, WA',
      contact: 'Elena Rostova (+1 206-555-1190)'
    },
    destination: {
      name: 'Cascadia Clinical Center',
      address: '740 Medical Center Drive, Portland, OR',
      contact: 'Dr. Rebecca Chen (+1 503-555-9081)'
    },
    package: {
      type: 'Cold Chain',
      weight: 28.0,
      dimensions: '60 x 50 x 40 cm',
      quantity: 5,
      declaredValue: 8500,
      description: 'Temperature-Controlled Biologic Samples (-20°C)'
    },
    priority: 'express',
    pricing: {
      base: 25.0,
      weightCharge: 78.4,
      prioritySurcharge: 35.0,
      fuelSurcharge: 8.99,
      insurance: 127.5,
      tax: 13.74,
      total: 288.63
    },
    assignedPartnerId: 'drv_02',
    eta: '2 hrs 15 mins',
    distanceRemainingKm: 145.0,
    currentCoords: { x: 42, y: 48 },
    routeCoords: [
      { x: 15, y: 15, label: 'Seattle Port' },
      { x: 28, y: 32, label: 'Tacoma Depot' },
      { x: 42, y: 48, label: 'Current: Olympia I-5' },
      { x: 65, y: 70, label: 'Vancouver Hub' },
      { x: 85, y: 88, label: 'Portland Hospital' }
    ],
    timeline: [
      { milestone: 'Shipment Created', time: '06:30 AM', location: 'Seattle Port Office', done: true },
      { milestone: 'Pickup Scheduled', time: '07:00 AM', location: 'Cold Store Dock 2', done: true },
      { milestone: 'Picked Up', time: '07:30 AM', location: 'Elena Rostova (Refrigerated Van)', done: true },
      { milestone: 'In Transit', time: '08:45 AM', location: 'I-5 Corridor', done: true },
      { milestone: 'Out for Delivery', time: 'Pending', location: 'Portland District', done: false },
      { milestone: 'Delivered', time: 'Pending', location: 'Cascadia Clinical Lab', done: false }
    ],
    pod: null,
    invoiceId: 'INV-2026-749120'
  },
  {
    id: 'SF-610943',
    date: '2026-09-30 14:00',
    status: 'Delivered',
    origin: {
      name: 'Midwest Precision Castings',
      address: '800 Industrial Pkwy, Chicago, IL',
      contact: 'Arthur King (+1 312-555-6671)'
    },
    destination: {
      name: 'Great Lakes Motor Works',
      address: '450 Assembly Drive, Detroit, MI',
      contact: 'Jim Vance (+1 313-555-8844)'
    },
    package: {
      type: 'Pallet Cargo',
      weight: 85.0,
      dimensions: '120 x 100 x 90 cm',
      quantity: 2,
      declaredValue: 4200,
      description: 'Transmission Housing Castings'
    },
    priority: 'freight',
    pricing: {
      base: 25.0,
      weightCharge: 238.0,
      prioritySurcharge: 65.0,
      fuelSurcharge: 21.32,
      insurance: 63.0,
      tax: 20.61,
      total: 432.93
    },
    assignedPartnerId: 'drv_03',
    eta: 'Delivered',
    distanceRemainingKm: 0,
    currentCoords: { x: 88, y: 85 },
    routeCoords: [
      { x: 18, y: 40, label: 'Chicago Hub' },
      { x: 45, y: 55, label: 'Kalamazoo Transit' },
      { x: 88, y: 85, label: 'Detroit Assembly (Delivered)' }
    ],
    timeline: [
      { milestone: 'Shipment Created', time: 'Sep 30, 09:00 AM', location: 'Chicago Logistics', done: true },
      { milestone: 'Pickup Scheduled', time: 'Sep 30, 10:15 AM', location: 'Dock 6', done: true },
      { milestone: 'Picked Up', time: 'Sep 30, 11:30 AM', location: 'Devon Patel (Freightliner)', done: true },
      { milestone: 'In Transit', time: 'Sep 30, 01:15 PM', location: 'I-94 Eastbound', done: true },
      { milestone: 'Out for Delivery', time: 'Sep 30, 04:30 PM', location: 'Detroit Gate 3', done: true },
      { milestone: 'Delivered', time: 'Sep 30, 05:15 PM', location: 'Detroit Receiving', done: true }
    ],
    pod: {
      receiverName: 'Jim Vance (Logistics Supervisor)',
      timestamp: '2026-09-30 17:15',
      signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,40 Q40,10 70,40 T130,20 T180,45" fill="none" stroke="%232563eb" stroke-width="3"/></svg>',
      confirmationCode: '5892',
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
    },
    invoiceId: 'INV-2026-610943'
  }
];

const initialPricing = {
  ruleId: 'global_rate_card',
  baseFee: 25.0,
  perKgRate: 2.8,
  priorityMultipliers: {
    standard: 1.0,
    express: 1.45,
    sameday: 2.1,
    freight: 1.75
  },
  fuelSurchargePct: 6.5,
  taxPct: 5.0,
  insurancePer100: 1.5
};

const initialNotifications = [
  {
    notifId: 'ntf_01',
    userId: 'usr_shipper_01',
    title: 'Shipment Out for Delivery',
    message: 'Shipment SF-892401 is out for delivery with driver Marcus Cole. ETA 28 mins.',
    time: '10 mins ago',
    type: 'delivery',
    read: false
  },
  {
    notifId: 'ntf_02',
    userId: 'usr_shipper_01',
    title: 'Cold Chain Checkpoint Passed',
    message: 'Shipment SF-749120 logged temperature at -19.4°C. Stable condition on I-5.',
    time: '42 mins ago',
    type: 'transit',
    read: false
  },
  {
    notifId: 'ntf_03',
    userId: 'usr_shipper_01',
    title: 'Delivery Proof Received',
    message: 'Shipment SF-610943 successfully signed & delivered to Jim Vance in Detroit.',
    time: 'Yesterday',
    type: 'success',
    read: true
  }
];

const initialTickets = [
  {
    id: 'TCK-4019',
    subject: 'Request cold chain telemetry report for SF-749120',
    shipper: 'Alex Vance (Nexus Logistics)',
    date: '2026-10-01 08:30',
    status: 'Open',
    priority: 'High',
    messages: [
      { sender: 'Alex Vance', time: '08:30 AM', text: 'Please provide certified FDA cold chain temperature log for transit.' },
      { sender: 'ShipFlow Operations', time: '09:05 AM', text: 'Telemetry verified at -19.4°C. Generating signed audit PDF.' }
    ]
  },
  {
    id: 'TCK-3980',
    subject: 'Gate pass authorization code for Chicago Hub',
    shipper: 'Arthur King',
    date: '2026-09-30 11:00',
    status: 'Resolved',
    priority: 'Normal',
    messages: [
      { sender: 'Arthur King', time: '11:00 AM', text: 'Gate 4 code needed for Devon Patel truck.' },
      { sender: 'ShipFlow Ops', time: '11:08 AM', text: 'Gate pass #8942 assigned. Driver notified.' }
    ]
  }
];

const initialAddresses = [
  { title: 'Nexus Silicon Valley Warehouse', address: '400 Logistics Blvd, San Francisco, CA', contact: '+1 415-890-2341', isDefault: true },
  { title: 'AeroTech Systems Receiving Hub', address: '1200 Innovation Way, San Jose, CA', contact: '+1 408-555-8922' },
  { title: 'Pacific BioPharma Terminal', address: 'Terminal 18, Seattle Port, WA', contact: '+1 206-555-1190' },
  { title: 'Midwest Assembly Plant', address: '800 Industrial Pkwy, Chicago, IL', contact: '+1 312-555-6671' }
];

const initialInvoices = initialShipments.map(s => ({
  invoiceId: s.invoiceId, shipmentId: s.id, date: s.date?.substring(0, 10),
  consignor: s.origin, consignee: s.destination,
  lineItems: [{ description: s.package?.description || 'Shipment service', amount: s.pricing?.total || 0 }],
  totalAmount: s.pricing?.total || 0, paymentStatus: s.status === 'Delivered' ? 'PAID' : 'PENDING', paymentMethod: 'Corporate Billing Line'
}));

async function seedDatabase({ manageConnection = true } = {}) {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    if (mongoose.connection.readyState !== 1) await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await Partner.deleteMany({});
    await Shipment.deleteMany({});
    await PricingRule.deleteMany({});
    await Notification.deleteMany({});
    await SupportTicket.deleteMany({});
    await Address.deleteMany({});
    await Invoice.deleteMany({});

    console.log('Existing collections cleared.');

    // Insert seeds
    await User.insertMany(initialUsers);
    await Partner.insertMany(initialPartners);
    await Shipment.insertMany(initialShipments);
    await PricingRule.create(initialPricing);
    await Notification.insertMany(initialNotifications);
    await SupportTicket.insertMany(initialTickets);
    await Address.insertMany(initialAddresses);
    await Invoice.insertMany(initialInvoices);

    console.log('✅ Seed completed successfully:');
    console.log(`- ${initialUsers.length} Users`);
    console.log(`- ${initialPartners.length} Delivery Partners`);
    console.log(`- ${initialShipments.length} Shipments`);
    console.log(`- ${initialNotifications.length} Notifications`);
    console.log(`- ${initialTickets.length} Support Tickets`);
    console.log(`- ${initialInvoices.length} Invoices`);

    if (manageConnection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
    }
  } catch (err) {
    console.error('Seed script error:', err);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
