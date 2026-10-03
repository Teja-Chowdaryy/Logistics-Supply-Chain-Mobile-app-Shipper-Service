/**
 * ShipFlow Logistics & Supply Chain Platform
 * Core Application Engine & State Management
 */

const SHIPMENT_LIFECYCLE = ['Created', 'Confirmed', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
const SHIPMENT_STATUS_INDEX = Object.fromEntries(SHIPMENT_LIFECYCLE.map((status, index) => [status, index]));

function normalizeShipmentLifecycle(shipment) {
  const legacy = { 'Shipment Created': 'Created', 'Pickup Scheduled': 'Confirmed' };
  const current = shipment.status === 'Pending' ? 'Created' : shipment.status;
  const idx = SHIPMENT_STATUS_INDEX[current] ?? 0;
  const old = new Map((shipment.timeline || []).map(item => [legacy[item.milestone] || item.milestone, item]));
  shipment.status = current;
  shipment.timeline = SHIPMENT_LIFECYCLE.map((milestone, i) => ({
    milestone,
    time: i <= idx ? (old.get(milestone)?.time && old.get(milestone).time !== 'Pending' ? old.get(milestone).time : (i === 0 ? 'Just now' : 'Pending')) : 'Pending',
    location: old.get(milestone)?.location || (milestone === 'Created' ? 'ShipFlow Shipper Portal' : '-'),
    done: i <= idx
  }));
  return shipment;
}

// ============================================================================
// Database & State Management (LocalStorage with Initial Seed Data)
// ============================================================================
const ShipFlowDB = {
  KEY: 'SHIPFLOW_STATE_V1',

  getInitialState() {
    return {
      currentRole: 'shipper', // 'shipper', 'partner', 'admin'
      currentUser: {
        id: 'usr_shipper_01',
        name: 'Alex Vance',
        company: 'Nexus Logistics Inc.',
        email: 'alex@nexuslogistics.com',
        phone: '+1 (415) 890-2341',
        accountNo: 'NL-8842-US',
        role: 'shipper',
        kycStatus: 'Verified',
        balance: 14500.00
      },
      pricingRules: {
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
      },
      partners: [
        {
          id: 'drv_01',
          name: 'Marcus Cole',
          avatar: 'MC',
          phone: '+1 (555) 349-8821',
          vehicle: 'Ford Transit 350 (Plate: CA-8X92K)',
          rating: 4.92,
          deliveriesCompleted: 342,
          status: 'Online',
          currentLocation: 'Mission District, San Francisco'
        },
        {
          id: 'drv_02',
          name: 'Elena Rostova',
          avatar: 'ER',
          phone: '+1 (555) 712-4099',
          vehicle: 'Mercedes Sprinter (Plate: WA-4M19Z)',
          rating: 4.88,
          deliveriesCompleted: 219,
          status: 'Online',
          currentLocation: 'Interstate 5 Northbound'
        },
        {
          id: 'drv_03',
          name: 'Devon Patel',
          avatar: 'DP',
          phone: '+1 (555) 430-1120',
          vehicle: 'Freightliner Box Truck (Plate: IL-9P23Q)',
          rating: 4.95,
          deliveriesCompleted: 580,
          status: 'Online',
          currentLocation: 'Chicago Metro Logistics Park'
        }
      ],
      shipments: [
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
          assignedPartnerId: null,
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
          status: 'Confirmed',
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
        },
        {
          id: 'SF-502188',
          date: '2026-10-01 10:45',
          status: 'Pending',
          origin: {
            name: 'Eco-Fabrics Distribution Center',
            address: '900 Alameda St, Los Angeles, CA',
            contact: 'Maria Gomez (+1 213-555-7733)'
          },
          destination: {
            name: 'Sunland Apparel Studios',
            address: '320 Marina Blvd, San Diego, CA',
            contact: 'Chloe Adams (+1 619-555-9012)'
          },
          package: {
            type: 'Parcel',
            weight: 38.0,
            dimensions: '80 x 60 x 50 cm',
            quantity: 4,
            declaredValue: 1800,
            description: 'Organic Cotton Fabric Rolls & Textile Samples'
          },
          priority: 'standard',
          pricing: {
            base: 25.0,
            weightCharge: 106.4,
            prioritySurcharge: 0.0,
            fuelSurcharge: 8.54,
            insurance: 27.0,
            tax: 8.34,
            total: 175.28
          },
          assignedPartnerId: null,
          eta: 'Pending Driver Acceptance',
          distanceRemainingKm: 190.0,
          currentCoords: { x: 22, y: 25 },
          routeCoords: [
            { x: 22, y: 25, label: 'LA DC' },
            { x: 50, y: 55, label: 'I-5 South' },
            { x: 80, y: 85, label: 'San Diego' }
          ],
          timeline: [
            { milestone: 'Shipment Created', time: '10:45 AM', location: 'Los Angeles Depot', done: true },
            { milestone: 'Pickup Scheduled', time: 'Scheduled for 02:00 PM', location: 'Awaiting Driver', done: false },
            { milestone: 'Picked Up', time: 'Pending', location: '-', done: false },
            { milestone: 'In Transit', time: 'Pending', location: '-', done: false },
            { milestone: 'Out for Delivery', time: 'Pending', location: '-', done: false },
            { milestone: 'Delivered', time: 'Pending', location: '-', done: false }
          ],
          pod: null,
          invoiceId: 'INV-2026-502188'
        }
      ],
      notifications: [
        {
          id: 'ntf_01',
          title: 'Shipment Out for Delivery',
          message: 'Shipment SF-892401 is out for delivery with driver Marcus Cole. ETA 28 mins.',
          time: '10 mins ago',
          type: 'delivery',
          read: false
        },
        {
          id: 'ntf_02',
          title: 'Cold Chain Checkpoint Passed',
          message: 'Shipment SF-749120 logged temperature at -19.4°C. Stable condition on I-5.',
          time: '42 mins ago',
          type: 'transit',
          read: false
        },
        {
          id: 'ntf_03',
          title: 'Delivery Proof Received',
          message: 'Shipment SF-610943 successfully signed & delivered to Jim Vance in Detroit.',
          time: 'Yesterday',
          type: 'success',
          read: true
        },
        {
          id: 'ntf_04',
          title: 'Invoice Generated',
          message: 'Invoice INV-2026-892401 for $131.28 is ready for download.',
          time: '2 hours ago',
          type: 'billing',
          read: false
        }
      ],
      supportTickets: [
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
      ],
      savedAddresses: [
        { title: 'Nexus Silicon Valley Warehouse', address: '400 Logistics Blvd, San Francisco, CA', contact: '+1 415-890-2341' },
        { title: 'AeroTech Systems Receiving Hub', address: '1200 Innovation Way, San Jose, CA', contact: '+1 408-555-8922' },
        { title: 'Pacific BioPharma Terminal', address: 'Terminal 18, Seattle Port, WA', contact: '+1 206-555-1190' },
        { title: 'Midwest Assembly Plant', address: '800 Industrial Pkwy, Chicago, IL', contact: '+1 312-555-6671' }
      ]
    };
  },

  load() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage error, using defaults', e);
    }
    const fresh = this.getInitialState();
    this.save(fresh);
    return fresh;
  },

  save(state) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }
};

// ============================================================================
// MongoDB REST API Service Layer (Port 5000)
// ============================================================================
const ShipFlowAPI = {
  BASE_URL: 'http://localhost:5000/api',
  isOnline: false,

  getToken() { return localStorage.getItem('SHIPFLOW_AUTH_TOKEN') || ''; },
  setSession(data) {
    if (data?.token) localStorage.setItem('SHIPFLOW_AUTH_TOKEN', data.token);
    if (data?.user) localStorage.setItem('SHIPFLOW_AUTH_USER', JSON.stringify(data.user));
  },
  clearSession() { localStorage.removeItem('SHIPFLOW_AUTH_TOKEN'); localStorage.removeItem('SHIPFLOW_AUTH_USER'); },
  authHeaders(extra = {}) {
    const token = this.getToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
  },

  timeoutSignal(ms) {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  },

  async checkHealth() {
    try {
      const res = await fetch(`${this.BASE_URL}/health`, { signal: this.timeoutSignal(2000) });
      const data = await res.json();
      this.isOnline = data && data.mongodb && data.mongodb.connected;
      this.updateStatusBadge();
      return this.isOnline;
    } catch (e) {
      this.isOnline = false;
      this.updateStatusBadge();
      return false;
    }
  },

  async loadState() {
    try {
      const res = await fetch(`${this.BASE_URL}/state`, { headers: this.authHeaders(), signal: this.timeoutSignal(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.isOnline = true;
          this.updateStatusBadge();
          return json;
        }
      }
    } catch (e) {
      this.isOnline = false;
      this.updateStatusBadge();
    }
    return null;
  },

  async createShipment(shipment) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/shipments`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(shipment)
      });
      return await res.json();
    } catch (e) {
      console.warn('MongoDB offline fallback for createShipment');
      return null;
    }
  },

  async updateStatus(id, status) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/shipments/${id}/status`, {
        method: 'PUT',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async assignShipment(id, partnerId) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/shipments/${id}/assign`, {
        method: 'PUT',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ partnerId })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async submitPOD(id, podData) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/shipments/${id}/pod`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(podData)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async updatePricing(pricingRules) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/pricing`, {
        method: 'PUT',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(pricingRules)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async createTicket(ticket) {
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/tickets`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(ticket)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async login(email, password, role) {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role }) });
      const data = await res.json();
      if (res.ok && data.success) this.setSession(data);
      return data;
    } catch (e) { return { success: false, message: 'Backend unavailable. Start MongoDB and the ShipFlow server.' }; }
  },

  async register(payload) {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.success) this.setSession(data);
      return data;
    } catch (e) { return { success: false, message: 'Backend unavailable. Start MongoDB and the ShipFlow server.' }; }
  },

  async reseedMongo() {
    try {
      const res = await fetch(`${this.BASE_URL}/seed`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  updateStatusBadge() {
    const badge = document.getElementById('mongoDbStatusBadge');
    if (!badge) return;
    if (this.isOnline) {
      badge.className = 'view-mode-toggle';
      badge.style.background = '#064e3b';
      badge.style.borderColor = '#10b981';
      badge.style.color = '#34d399';
      badge.innerHTML = `<span style="width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 6px #10b981; display:inline-block;"></span> MongoDB Live`;
      badge.title = 'Connected to MongoDB (Port 5000). Click to re-sync.';
    } else {
      badge.className = 'view-mode-toggle';
      badge.style.background = '#1e293b';
      badge.style.borderColor = '#475569';
      badge.style.color = '#94a3b8';
      badge.innerHTML = `<span style="width:8px; height:8px; background:#f59e0b; border-radius:50%; display:inline-block;"></span> Offline Mode`;
      badge.title = 'Node/MongoDB backend not detected. Running in LocalStorage mode. Click to retry connection.';
    }
  }
};

// ============================================================================
// Application Core Controller
// ============================================================================
class ShipFlowApp {
  constructor() {
    this.state = ShipFlowDB.load();
    this.activeTab = 'dashboard'; // 'dashboard', 'shipments', 'track', 'partner', 'profile', 'admin'
    this.selectedShipmentId = 'SF-892401';
    this.createShipmentStep = 1;
    this.newShipmentData = {
      pickupName: 'Nexus Silicon Valley Warehouse',
      pickupAddress: '400 Logistics Blvd, San Francisco, CA',
      pickupPhone: '+1 (415) 890-2341',
      receiverName: '',
      deliveryAddress: '',
      receiverPhone: '',
      packageType: 'Parcel',
      weight: 12.0,
      length: 40,
      width: 30,
      height: 25,
      quantity: 1,
      declaredValue: 500,
      priority: 'express',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeSlot: '14:00 - 17:00',
      instructions: 'Handle with care. Deliver to front reception.',
      requiresSignature: true
    };

    this.simulatingVehicle = false;
    this.simulationProgress = 0.55; // 0 to 1
    this.mapAnimFrame = null;

    this.init();
  }

  async init() {
    this.bindGlobalEvents();
    this.renderCurrentView();
    this.startLiveSimulationTimer();

    // Check MongoDB connection & auto-sync
    this.syncWithMongoDB();

    // Auto dismiss splash screen after brief showcase
    setTimeout(() => {
      const splash = document.getElementById('splashScreen');
      if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 550);
      }
    }, 1800);
  }

  persist() {
    ShipFlowDB.save(this.state);
  }

  async syncWithMongoDB(showToastAlert = false) {
    const remoteState = await ShipFlowAPI.loadState();
    if (remoteState && remoteState.shipments && remoteState.shipments.length > 0) {
      if (remoteState.currentUser) this.state.currentUser = remoteState.currentUser;
      this.state.shipments = remoteState.shipments.map(normalizeShipmentLifecycle);
      if (remoteState.pricingRules) this.state.pricingRules = remoteState.pricingRules;
      if (remoteState.partners) this.state.partners = remoteState.partners.map(p => ({ ...p, id: p.id || p.partnerId }));
      if (remoteState.notifications) this.state.notifications = remoteState.notifications;
      if (remoteState.supportTickets) this.state.supportTickets = remoteState.supportTickets;
      this.persist();
      this.renderCurrentView();
      if (showToastAlert) {
        this.showToast('🍃 Successfully synchronized with live MongoDB!', 'success');
      }
    } else {
      ShipFlowAPI.updateStatusBadge();
      if (showToastAlert) {
        this.showToast('MongoDB server not detected at port 5000. Running in LocalStorage mode.', 'warning');
      }
    }
  }

  // ==========================================================================
  // Role & View Navigation
  // ==========================================================================
  setRole(role) {
    this.state.currentRole = role;
    this.persist();

    // Update outer role toggle buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    // Reset default active tab for that role
    if (role === 'shipper') {
      this.activeTab = 'dashboard';
    } else if (role === 'partner') {
      this.activeTab = 'partner';
    } else if (role === 'admin') {
      this.activeTab = 'admin';
    }

    this.renderCurrentView();
    this.showToast(`Switched view to: ${role.toUpperCase()}`, 'info');
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.renderCurrentView();
  }

  toggleViewMode() {
    const wrapper = document.getElementById('deviceWrapper');
    const btn = document.getElementById('viewModeBtn');
    if (wrapper.classList.contains('phone-frame')) {
      wrapper.classList.remove('phone-frame');
      wrapper.classList.add('full-view');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/></svg> Mobile Frame`;
    } else {
      wrapper.classList.remove('full-view');
      wrapper.classList.add('phone-frame');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Full View`;
    }
  }

  // ==========================================================================
  // Live Cost Estimation Calculator
  // ==========================================================================
  calculateCost(weight, priority, declaredValue) {
    const rules = this.state.pricingRules;
    const base = Number(rules.baseFee);
    const weightFee = Number((weight * rules.perKgRate).toFixed(2));
    const mult = rules.priorityMultipliers[priority] || 1.0;
    const priorityFee = Number(((base + weightFee) * (mult - 1)).toFixed(2));
    const subtotal = base + weightFee + priorityFee;
    const fuel = Number((subtotal * (rules.fuelSurchargePct / 100)).toFixed(2));
    const insurance = Number(((declaredValue / 100) * rules.insurancePer100).toFixed(2));
    const tax = Number(((subtotal + fuel) * (rules.taxPct / 100)).toFixed(2));
    const total = Number((subtotal + fuel + insurance + tax).toFixed(2));

    return {
      base,
      weightFee,
      priorityFee,
      fuel,
      insurance,
      tax,
      total
    };
  }

  // ==========================================================================
  // Rendering Views
  // ==========================================================================
  renderCurrentView() {
    this.updateHeaderUserInfo();
    this.renderBottomNavigation();

    const mainContainer = document.getElementById('screenScrollContainer');
    if (!mainContainer) return;

    if (this.activeTab === 'dashboard') {
      mainContainer.innerHTML = this.getDashboardHTML();
      this.attachDashboardEvents();
    } else if (this.activeTab === 'createShipment') {
      mainContainer.innerHTML = this.getCreateShipmentHTML();
      this.attachCreateShipmentEvents();
    } else if (this.activeTab === 'shipments') {
      mainContainer.innerHTML = this.getShipmentsHistoryHTML();
      this.attachShipmentsHistoryEvents();
    } else if (this.activeTab === 'track') {
      mainContainer.innerHTML = this.getTrackingHTML();
      this.attachTrackingEvents();
      this.renderInteractiveMap();
    } else if (this.activeTab === 'partner') {
      mainContainer.innerHTML = this.getPartnerHTML();
      this.attachPartnerEvents();
    } else if (this.activeTab === 'admin') {
      mainContainer.innerHTML = this.getAdminHTML();
      this.attachAdminEvents();
    } else if (this.activeTab === 'profile') {
      mainContainer.innerHTML = this.getProfileHTML();
      this.attachProfileEvents();
    } else if (this.activeTab === 'notifications') {
      mainContainer.innerHTML = this.getNotificationsHTML();
      this.attachNotificationsEvents();
    }
  }

  updateHeaderUserInfo() {
    const role = this.state.currentRole;
    const user = this.state.currentUser;
    const userNameEl = document.getElementById('appBarUserName');
    const userRoleEl = document.getElementById('appBarUserRole');
    const userSubEl = document.getElementById('appBarUserSub');
    const avatarEl = document.getElementById('appBarAvatar');

    if (!userNameEl) return;

    if (role === 'shipper') {
      userNameEl.innerText = user.name;
      userRoleEl.className = 'app-bar-role-badge';
      userRoleEl.innerText = 'Shipper';
      userSubEl.innerText = user.company;
      avatarEl.innerText = 'AV';
    } else if (role === 'partner') {
      userNameEl.innerText = 'Marcus Cole';
      userRoleEl.className = 'app-bar-role-badge partner';
      userRoleEl.innerText = 'Driver Partner';
      userSubEl.innerText = 'Vehicle: Ford Transit (CA-8X92K)';
      avatarEl.innerText = 'MC';
    } else if (role === 'admin') {
      userNameEl.innerText = 'Sarah Lin';
      userRoleEl.className = 'app-bar-role-badge admin';
      userRoleEl.innerText = 'Fleet Admin';
      userSubEl.innerText = 'Operations Controller';
      avatarEl.innerText = 'SL';
    }
  }

  renderBottomNavigation() {
    const navBar = document.getElementById('bottomNavBar');
    if (!navBar) return;

    const role = this.state.currentRole;
    let html = '';

    if (role === 'shipper') {
      html = `
        <button class="nav-item ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="app.switchTab('dashboard')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </button>
        <button class="nav-item ${this.activeTab === 'shipments' ? 'active' : ''}" onclick="app.switchTab('shipments')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          Orders
        </button>
        <div class="nav-fab-center" title="Book Shipment" onclick="app.switchTab('createShipment')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <button class="nav-item ${this.activeTab === 'track' ? 'active' : ''}" onclick="app.switchTab('track')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Live Track
        </button>
        <button class="nav-item ${this.activeTab === 'profile' ? 'active' : ''}" onclick="app.switchTab('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </button>
      `;
    } else if (role === 'partner') {
      html = `
        <button class="nav-item ${this.activeTab === 'partner' ? 'active' : ''}" onclick="app.switchTab('partner')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          Driver Console
        </button>
        <button class="nav-item ${this.activeTab === 'track' ? 'active' : ''}" onclick="app.switchTab('track')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Route Map
        </button>
        <button class="nav-item ${this.activeTab === 'notifications' ? 'active' : ''}" onclick="app.switchTab('notifications')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Dispatches
        </button>
      `;
    } else if (role === 'admin') {
      html = `
        <button class="nav-item ${this.activeTab === 'admin' ? 'active' : ''}" onclick="app.switchTab('admin')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Operations
        </button>
        <button class="nav-item ${this.activeTab === 'shipments' ? 'active' : ''}" onclick="app.switchTab('shipments')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          All Fleet
        </button>
        <button class="nav-item ${this.activeTab === 'track' ? 'active' : ''}" onclick="app.switchTab('track')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          Radar
        </button>
      `;
    }

    navBar.innerHTML = html;
  }

  // ==========================================================================
  // VIEW: Shipper Dashboard
  // ==========================================================================
  getDashboardHTML() {
    const shipments = this.state.shipments;
    const total = shipments.length;
    const active = shipments.filter(s => !['Created', 'Delivered', 'Cancelled'].includes(s.status)).length;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    const pending = shipments.filter(s => ['Created', 'Confirmed', 'Assigned'].includes(s.status)).length;

    const activeShipment = shipments.find(s => s.id === 'SF-892401') || shipments[0];

    const recentList = shipments.slice(0, 3).map(s => `
      <div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')">
        <div class="shipment-card-top">
          <span class="shipment-tracking-id">${s.id}</span>
          <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
        </div>
        <div class="shipment-route-summary">
          <div class="route-icons-column">
            <div class="route-dot-start"></div>
            <div class="route-connect-line"></div>
            <div class="route-dot-end"></div>
          </div>
          <div class="route-text-column">
            <div class="route-text-item">${s.origin.name}</div>
            <div class="route-text-sub">${s.origin.address}</div>
            <div class="route-text-item">${s.destination.name}</div>
            <div class="route-text-sub">${s.destination.address}</div>
          </div>
        </div>
        <div class="shipment-card-bottom">
          <span>${s.date} • ${s.package.weight} kg</span>
          <span class="shipment-price-tag">$${s.pricing.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    return `
      <!-- KPI Metric Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Total Orders</span>
            <div class="kpi-icon-box kpi-icon-blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
          </div>
          <div class="kpi-value">${total}</div>
          <div style="font-size:0.7rem; color:#10b981; font-weight:600;">↑ 12% vs last month</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Active Transits</span>
            <div class="kpi-icon-box kpi-icon-purple">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
            </div>
          </div>
          <div class="kpi-value">${active}</div>
          <div style="font-size:0.7rem; color:#6366f1; font-weight:600;">2 out for delivery</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Delivered</span>
            <div class="kpi-icon-box kpi-icon-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="kpi-value">${delivered}</div>
          <div style="font-size:0.7rem; color:#10b981; font-weight:600;">100% POD On-Time</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-label">Pending</span>
            <div class="kpi-icon-box kpi-icon-amber">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="kpi-value">${pending}</div>
          <div style="font-size:0.7rem; color:#b45309; font-weight:600;">Dispatching fleet</div>
        </div>
      </div>

      <!-- Quick Action: Create Shipment Banner -->
      <div style="margin-bottom:16px;">
        <button class="btn btn-primary btn-block" style="padding:14px; font-size:0.95rem;" onclick="app.switchTab('createShipment')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create New Shipment
        </button>
      </div>

      <!-- Active Live Tracking Card -->
      <div class="section-title">
        <span>Live Priority Transit</span>
        <span class="section-link" onclick="app.viewShipmentTracking('${activeShipment.id}')">Interactive GPS Map →</span>
      </div>

      <div class="active-tracker-card" onclick="app.viewShipmentTracking('${activeShipment.id}')" style="cursor:pointer;">
        <div class="active-tracker-header">
          <span class="tracker-id-badge">${activeShipment.id}</span>
          <span class="tracker-eta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ETA ${activeShipment.eta}
          </span>
        </div>

        <div class="tracker-route-row">
          <div class="route-endpoint">
            <span class="route-city">San Francisco</span>
            <span class="route-hub">SF Terminal Hub</span>
          </div>

          <div class="route-line-wrap">
            <div class="route-line-track">
              <div class="route-line-fill" style="width: 72%;"></div>
              <div class="route-truck-icon" style="left: 72%;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
            </div>
          </div>

          <div class="route-endpoint" style="text-align:right;">
            <span class="route-city">San Jose</span>
            <span class="route-hub">AeroTech Bay</span>
          </div>
        </div>

        <div class="tracker-footer">
          <div class="tracker-status-text">
            <div class="status-pulse-dot"></div>
            <span>${activeShipment.status}: Palo Alto Highway Corridor</span>
          </div>
          <span style="color:#60a5fa; font-weight:600;">${activeShipment.distanceRemainingKm} km left</span>
        </div>
      </div>

      <!-- Recent Shipments -->
      <div class="section-title">
        <span>Recent Shipments</span>
        <span class="section-link" onclick="app.switchTab('shipments')">View All (${total})</span>
      </div>
      <div>
        ${recentList}
      </div>
    `;
  }

  attachDashboardEvents() {
    // any dashboard specific events
  }

  // ==========================================================================
  // VIEW: Create Shipment Multi-Step Wizard
  // ==========================================================================
  getCreateShipmentHTML() {
    const s = this.newShipmentData;
    const step = this.createShipmentStep;
    const cost = this.calculateCost(s.weight, s.priority, s.declaredValue);

    return `
      <div style="margin-bottom:14px;">
        <button class="btn btn-secondary btn-sm" onclick="app.switchTab('dashboard')">
          ← Back to Dashboard
        </button>
      </div>

      <!-- Step Indicators -->
      <div class="wizard-steps-header">
        <div class="step-indicator ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}">
          <div class="step-circle">${step > 1 ? '✓' : '1'}</div>
          <span class="step-title">Addresses</span>
        </div>
        <div class="step-indicator ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}">
          <div class="step-circle">${step > 2 ? '✓' : '2'}</div>
          <span class="step-title">Package</span>
        </div>
        <div class="step-indicator ${step === 3 ? 'active' : (step > 3 ? 'completed' : '')}">
          <div class="step-circle">${step > 3 ? '✓' : '3'}</div>
          <span class="step-title">Service</span>
        </div>
        <div class="step-indicator ${step === 4 ? 'active' : ''}">
          <div class="step-circle">4</div>
          <span class="step-title">Confirm</span>
        </div>
      </div>

      <!-- Step Content Wizard -->
      <div class="card">
        ${this.getWizardStepBodyHTML(step, s, cost)}
      </div>

      <!-- Dynamic Live Cost Estimate Preview -->
      <div class="rate-breakdown-card">
        <div style="font-weight:700; font-size:0.86rem; color:#1e293b; margin-bottom:8px; display:flex; justify-content:space-between;">
          <span>Transparent Shipping Breakdown</span>
          <span style="color:#2563eb;">Live Rate Engine</span>
        </div>
        <div class="breakdown-row">
          <span>Base Carrier Charge</span>
          <span>$${cost.base.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span>Weight Charge (${s.weight} kg @ $${this.state.pricingRules.perKgRate}/kg)</span>
          <span>$${cost.weightFee.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span>Priority Upgrade (${s.priority.toUpperCase()})</span>
          <span>$${cost.priorityFee.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span>Fuel Surcharge (${this.state.pricingRules.fuelSurchargePct}%)</span>
          <span>$${cost.fuel.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span>Cargo Insurance (Valued at $${s.declaredValue})</span>
          <span>$${cost.insurance.toFixed(2)}</span>
        </div>
        <div class="breakdown-row">
          <span>State Logistics Tax (${this.state.pricingRules.taxPct}%)</span>
          <span>$${cost.tax.toFixed(2)}</span>
        </div>
        <div class="breakdown-row total">
          <span>Estimated Total Cost</span>
          <span style="color:#2563eb; font-size:1.15rem;">$${cost.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        ${step > 1 ? `
          <button class="btn btn-secondary" style="flex:1;" onclick="app.prevWizardStep()">
            Previous
          </button>
        ` : ''}
        ${step < 4 ? `
          <button class="btn btn-primary" style="flex:2;" onclick="app.nextWizardStep()">
            Continue to Step ${step + 1} →
          </button>
        ` : `
          <button class="btn btn-success" style="flex:2; font-size:0.95rem;" onclick="app.submitBookShipment()">
            Confirm & Book Shipment ($${cost.total.toFixed(2)})
          </button>
        `}
      </div>
    `;
  }

  getWizardStepBodyHTML(step, s, cost) {
    if (step === 1) {
      return `
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:14px; color:#1e293b;">Pickup & Delivery Locations</h3>
        
        <div style="padding:10px; background:#eff6ff; border-radius:8px; margin-bottom:14px; font-size:0.75rem; color:#1e3a8a;">
          📍 Fast Pickup: Selected from your default Nexus Logistics San Francisco Depot.
        </div>

        <div class="form-group">
          <label class="form-label">Pickup Location Name</label>
          <input type="text" class="form-input" id="inpPickupName" value="${s.pickupName}">
        </div>

        <div class="form-group">
          <label class="form-label">Pickup Address</label>
          <input type="text" class="form-input" id="inpPickupAddress" value="${s.pickupAddress}">
        </div>

        <div class="form-group">
          <label class="form-label">Pickup Contact Phone</label>
          <input type="text" class="form-input" id="inpPickupPhone" value="${s.pickupPhone}">
        </div>

        <div style="border-top:1px dashed #cbd5e1; margin:16px 0;"></div>

        <div class="form-group">
          <label class="form-label">Receiver / Consignee Full Name *</label>
          <input type="text" class="form-input" id="inpReceiverName" placeholder="e.g. David Miller (AeroTech Systems)" value="${s.receiverName}">
        </div>

        <div class="form-group">
          <label class="form-label">Destination Address *</label>
          <input type="text" class="form-input" id="inpDeliveryAddress" placeholder="e.g. 1200 Innovation Way, San Jose, CA" value="${s.deliveryAddress}">
        </div>

        <div class="form-group">
          <label class="form-label">Receiver Phone Number *</label>
          <input type="text" class="form-input" id="inpReceiverPhone" placeholder="e.g. +1 (408) 555-8922" value="${s.receiverPhone}">
        </div>

        <div class="form-group">
          <label class="form-label">Special Delivery Instructions (Optional)</label>
          <textarea class="form-textarea" id="inpInstructions" rows="2" placeholder="e.g. Unload at Dock 3, ring buzzer on arrival">${s.instructions}</textarea>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:14px; color:#1e293b;">Package Specifications</h3>

        <label class="form-label">Select Cargo / Package Type</label>
        <div class="package-type-selector">
          <div class="type-pill-btn ${s.packageType === 'Parcel' ? 'selected' : ''}" onclick="app.setPackageType('Parcel')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Parcel</span>
          </div>
          <div class="type-pill-btn ${s.packageType === 'Fragile Goods' ? 'selected' : ''}" onclick="app.setPackageType('Fragile Goods')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>Fragile</span>
          </div>
          <div class="type-pill-btn ${s.packageType === 'Pallet Cargo' ? 'selected' : ''}" onclick="app.setPackageType('Pallet Cargo')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span>Pallet</span>
          </div>
          <div class="type-pill-btn ${s.packageType === 'Cold Chain' ? 'selected' : ''}" onclick="app.setPackageType('Cold Chain')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Cold Chain</span>
          </div>
          <div class="type-pill-btn ${s.packageType === 'Hazmat' ? 'selected' : ''}" onclick="app.setPackageType('Hazmat')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Hazmat</span>
          </div>
          <div class="type-pill-btn ${s.packageType === 'Documents' ? 'selected' : ''}" onclick="app.setPackageType('Documents')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Documents</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Total Weight (kg) *</label>
            <input type="number" step="0.5" class="form-input" id="inpWeight" value="${s.weight}" oninput="app.updateWeight(this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">Quantity (Units) *</label>
            <input type="number" class="form-input" id="inpQuantity" value="${s.quantity}" oninput="app.newShipmentData.quantity = Number(this.value)">
          </div>
        </div>

        <label class="form-label">Dimensions (L × W × H in cm)</label>
        <div class="form-row-3">
          <input type="number" class="form-input" placeholder="Length" value="${s.length}" oninput="app.newShipmentData.length = Number(this.value)">
          <input type="number" class="form-input" placeholder="Width" value="${s.width}" oninput="app.newShipmentData.width = Number(this.value)">
          <input type="number" class="form-input" placeholder="Height" value="${s.height}" oninput="app.newShipmentData.height = Number(this.value)">
        </div>

        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">Declared Value ($ USD for Insurance) *</label>
          <input type="number" class="form-input" id="inpDeclaredValue" value="${s.declaredValue}" oninput="app.updateDeclaredValue(this.value)">
        </div>
      `;
    }

    if (step === 3) {
      return `
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:14px; color:#1e293b;">Delivery Priority & Service Tier</h3>

        <div class="priority-options-list">
          <div class="priority-card-radio ${s.priority === 'standard' ? 'selected' : ''}" onclick="app.setPriority('standard')">
            <div class="priority-left">
              <div class="priority-radio-dot"></div>
              <div class="priority-details">
                <span class="priority-name">Standard Ground Fleet</span>
                <span class="priority-desc">Economical transit in 2-3 business days</span>
              </div>
            </div>
            <span class="priority-price">$${this.calculateCost(s.weight, 'standard', s.declaredValue).total.toFixed(2)}</span>
          </div>

          <div class="priority-card-radio ${s.priority === 'express' ? 'selected' : ''}" onclick="app.setPriority('express')">
            <div class="priority-left">
              <div class="priority-radio-dot"></div>
              <div class="priority-details">
                <span class="priority-name">Express Priority (Recommended)</span>
                <span class="priority-desc">Next-Day guaranteed arrival by 12:00 PM</span>
              </div>
            </div>
            <span class="priority-price">$${this.calculateCost(s.weight, 'express', s.declaredValue).total.toFixed(2)}</span>
          </div>

          <div class="priority-card-radio ${s.priority === 'sameday' ? 'selected' : ''}" onclick="app.setPriority('sameday')">
            <div class="priority-left">
              <div class="priority-radio-dot"></div>
              <div class="priority-details">
                <span class="priority-name">Same-Day Direct Courier</span>
                <span class="priority-desc">Direct dispatch within 4 hours</span>
              </div>
            </div>
            <span class="priority-price">$${this.calculateCost(s.weight, 'sameday', s.declaredValue).total.toFixed(2)}</span>
          </div>

          <div class="priority-card-radio ${s.priority === 'freight' ? 'selected' : ''}" onclick="app.setPriority('freight')">
            <div class="priority-left">
              <div class="priority-radio-dot"></div>
              <div class="priority-details">
                <span class="priority-name">Heavy Freight Linehaul</span>
                <span class="priority-desc">Liftgate truck with specialized cargo straps</span>
              </div>
            </div>
            <span class="priority-price">$${this.calculateCost(s.weight, 'freight', s.declaredValue).total.toFixed(2)}</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Pickup Date</label>
            <input type="date" class="form-input" id="inpPickupDate" value="${s.pickupDate}">
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time Window</label>
            <select class="form-select" id="inpTimeSlot">
              <option value="09:00 - 12:00">Morning (09:00 - 12:00)</option>
              <option value="12:00 - 15:00">Early Afternoon (12:00 - 15:00)</option>
              <option value="15:00 - 18:00" selected>Late Afternoon (15:00 - 18:00)</option>
              <option value="18:00 - 21:00">Evening Direct (18:00 - 21:00)</option>
            </select>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
          <input type="checkbox" id="chkSignature" ${s.requiresSignature ? 'checked' : ''} onchange="app.newShipmentData.requiresSignature = this.checked">
          <label for="chkSignature" style="font-size:0.8rem; font-weight:600; cursor:pointer;">Require Electronic Signature on Delivery (Proof of Delivery)</label>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:14px; color:#1e293b;">Review & Confirm Booking</h3>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:14px;">
          <div style="font-weight:700; font-size:0.88rem; margin-bottom:8px; color:#2563eb;">Route Details</div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Pickup:</strong> ${s.pickupName} (${s.pickupAddress})</div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Destination:</strong> ${s.receiverName || 'AeroTech Systems'} (${s.deliveryAddress || '1200 Innovation Way, San Jose, CA'})</div>
          <div style="font-size:0.8rem;"><strong>Receiver Contact:</strong> ${s.receiverPhone || '+1 (408) 555-8922'}</div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:14px;">
          <div style="font-weight:700; font-size:0.88rem; margin-bottom:8px; color:#2563eb;">Package & Priority</div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Type:</strong> ${s.packageType} (${s.quantity} pcs)</div>
          <div style="font-size:0.8rem; margin-bottom:4px;"><strong>Weight & Dims:</strong> ${s.weight} kg (${s.length}x${s.width}x${s.height} cm)</div>
          <div style="font-size:0.8rem;"><strong>Service Tier:</strong> ${s.priority.toUpperCase()} Delivery</div>
        </div>

        <label class="form-label">Payment Method</label>
        <select class="form-select" id="inpPaymentMethod" style="margin-bottom:14px;">
          <option value="corporate">Nexus Corporate Account (Monthly Credit Line: $45,000 available)</option>
          <option value="card">Company Visa •••• 4821</option>
          <option value="wallet">ShipFlow Prepaid Balance ($14,500.00)</option>
        </select>

        <div style="font-size:0.75rem; color:#64748b; line-height:1.4;">
          🔒 By confirming, this shipment will be registered into the live dispatch engine. A driver will be assigned, an automated commercial invoice generated, and real-time tracking initiated.
        </div>
      `;
    }
  }

  attachCreateShipmentEvents() {
    // Collect values from step 1
    const pName = document.getElementById('inpPickupName');
    const pAddr = document.getElementById('inpPickupAddress');
    const pPhone = document.getElementById('inpPickupPhone');
    const rName = document.getElementById('inpReceiverName');
    const rAddr = document.getElementById('inpDeliveryAddress');
    const rPhone = document.getElementById('inpReceiverPhone');
    const rInst = document.getElementById('inpInstructions');

    if (pName) pName.oninput = () => { this.newShipmentData.pickupName = pName.value; };
    if (pAddr) pAddr.oninput = () => { this.newShipmentData.pickupAddress = pAddr.value; };
    if (pPhone) pPhone.oninput = () => { this.newShipmentData.pickupPhone = pPhone.value; };
    if (rName) rName.oninput = () => { this.newShipmentData.receiverName = rName.value; };
    if (rAddr) rAddr.oninput = () => { this.newShipmentData.deliveryAddress = rAddr.value; };
    if (rPhone) rPhone.oninput = () => { this.newShipmentData.receiverPhone = rPhone.value; };
    if (rInst) rInst.oninput = () => { this.newShipmentData.instructions = rInst.value; };
  }

  setPackageType(type) {
    this.newShipmentData.packageType = type;
    this.renderCurrentView();
  }

  setPriority(pri) {
    this.newShipmentData.priority = pri;
    this.renderCurrentView();
  }

  updateWeight(val) {
    this.newShipmentData.weight = Math.max(0.5, Number(val) || 1);
    this.renderCurrentView();
  }

  updateDeclaredValue(val) {
    this.newShipmentData.declaredValue = Math.max(50, Number(val) || 50);
    this.renderCurrentView();
  }

  nextWizardStep() {
    if (this.createShipmentStep === 1) {
      if (!this.newShipmentData.receiverName) {
        this.newShipmentData.receiverName = 'AeroTech Systems Inc.';
      }
      if (!this.newShipmentData.deliveryAddress) {
        this.newShipmentData.deliveryAddress = '1200 Innovation Way, San Jose, CA';
      }
      if (!this.newShipmentData.receiverPhone) {
        this.newShipmentData.receiverPhone = '+1 (408) 555-8922';
      }
    }
    this.createShipmentStep = Math.min(4, this.createShipmentStep + 1);
    this.renderCurrentView();
  }

  prevWizardStep() {
    this.createShipmentStep = Math.max(1, this.createShipmentStep - 1);
    this.renderCurrentView();
  }

  submitBookShipment() {
    const s = this.newShipmentData;
    const trackingId = 'SF-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceId = 'INV-2026-' + trackingId.replace('SF-', '');
    const cost = this.calculateCost(s.weight, s.priority, s.declaredValue);

    const newShipment = {
      id: trackingId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'In Transit',
      origin: {
        name: s.pickupName || 'Nexus Silicon Valley Warehouse',
        address: s.pickupAddress || '400 Logistics Blvd, San Francisco, CA',
        contact: s.pickupPhone || '+1 (415) 890-2341'
      },
      destination: {
        name: s.receiverName || 'Consignee Receiver',
        address: s.deliveryAddress || '1200 Innovation Way, San Jose, CA',
        contact: s.receiverPhone || '+1 (408) 555-8922'
      },
      package: {
        type: s.packageType,
        weight: s.weight,
        dimensions: `${s.length} x ${s.width} x ${s.height} cm`,
        quantity: s.quantity,
        declaredValue: s.declaredValue,
        description: `${s.packageType} Cargo Batch #${trackingId}`
      },
      priority: s.priority,
      pricing: {
        base: cost.base,
        weightCharge: cost.weightFee,
        prioritySurcharge: cost.priorityFee,
        fuelSurcharge: cost.fuel,
        insurance: cost.insurance,
        tax: cost.tax,
        total: cost.total
      },
      assignedPartnerId: 'drv_01',
      eta: '45 mins',
      distanceRemainingKm: 22.4,
      currentCoords: { x: 30, y: 35 },
      routeCoords: [
        { x: 20, y: 25, label: 'Origin Hub' },
        { x: 30, y: 35, label: 'Driver Transit' },
        { x: 80, y: 80, label: 'Delivery Location' }
      ],
      timeline: [
        { milestone: 'Created', time: 'Just now', location: 'ShipFlow Shipper Portal', done: true },
        { milestone: 'Confirmed', time: 'Just now', location: 'Booking confirmed', done: true },
        { milestone: 'Assigned', time: 'Pending', location: '-', done: false },
        { milestone: 'Picked Up', time: 'Pending', location: '-', done: false },
        { milestone: 'In Transit', time: 'Pending', location: '-', done: false },
        { milestone: 'Out for Delivery', time: 'Pending', location: '-', done: false },
        { milestone: 'Delivered', time: 'Pending', location: '-', done: false }
      ],
      pod: null,
      invoiceId: invoiceId
    };

    // Prepend new shipment to database
    this.state.shipments.unshift(newShipment);

    // Prepend notification
    this.state.notifications.unshift({
      id: 'ntf_' + Date.now(),
      title: 'Shipment Booked & Confirmed',
      message: `Shipment ${trackingId} booked with ${s.priority.toUpperCase()} priority. Partner Marcus Cole assigned.`,
      time: 'Just now',
      type: 'success',
      read: false
    });

    this.persist();
    this.selectedShipmentId = trackingId;
    this.createShipmentStep = 1;

    // Persist to MongoDB if online
    ShipFlowAPI.createShipment(newShipment);

    this.showToast(`Shipment ${trackingId} booked successfully!`, 'success');
    this.switchTab('track');
  }

  // ==========================================================================
  // VIEW: Shipment History & Search/Filters
  // ==========================================================================
  getShipmentsHistoryHTML() {
    const list = this.state.shipments.map(s => `
      <div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')">
        <div class="shipment-card-top">
          <span class="shipment-tracking-id">${s.id}</span>
          <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
        </div>
        <div class="shipment-route-summary">
          <div class="route-icons-column">
            <div class="route-dot-start"></div>
            <div class="route-connect-line"></div>
            <div class="route-dot-end"></div>
          </div>
          <div class="route-text-column">
            <div class="route-text-item">${s.origin.name}</div>
            <div class="route-text-sub">${s.origin.address}</div>
            <div class="route-text-item">${s.destination.name}</div>
            <div class="route-text-sub">${s.destination.address}</div>
          </div>
        </div>
        <div class="shipment-card-bottom">
          <span>${s.date} • ${s.package.type} (${s.package.weight} kg)</span>
          <span class="shipment-price-tag">$${s.pricing.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="section-title">
        <span>Shipment Archive</span>
        <button class="btn btn-primary btn-sm" onclick="app.switchTab('createShipment')">+ New</button>
      </div>

      <!-- Search Input -->
      <div style="position:relative; margin-bottom:12px;">
        <input type="text" class="form-input" id="shipmentSearchInput" placeholder="Search by Tracking ID, City, or Consignee..." oninput="app.filterShipments(this.value)">
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs-row" id="shipmentFilterTabs">
        <button class="filter-tab active" onclick="app.filterByStatus('all', this)">All (${this.state.shipments.length})</button>
        <button class="filter-tab" onclick="app.filterByStatus('In Transit', this)">In Transit</button>
        <button class="filter-tab" onclick="app.filterByStatus('Out for Delivery', this)">Out for Delivery</button>
        <button class="filter-tab" onclick="app.filterByStatus('Delivered', this)">Delivered</button>
        <button class="filter-tab" onclick="app.filterByStatus('Pending', this)">Pending</button>
      </div>

      <div id="shipmentsListContainer">
        ${list}
      </div>
    `;
  }

  attachShipmentsHistoryEvents() {
    // Filter bindings
  }

  filterByStatus(status, el) {
    document.querySelectorAll('#shipmentFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const container = document.getElementById('shipmentsListContainer');
    if (!container) return;

    let filtered = this.state.shipments;
    if (status !== 'all') {
      filtered = filtered.filter(s => s.status.toLowerCase() === status.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No shipments found under this filter.</div>`;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')">
        <div class="shipment-card-top">
          <span class="shipment-tracking-id">${s.id}</span>
          <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
        </div>
        <div class="shipment-route-summary">
          <div class="route-icons-column">
            <div class="route-dot-start"></div>
            <div class="route-connect-line"></div>
            <div class="route-dot-end"></div>
          </div>
          <div class="route-text-column">
            <div class="route-text-item">${s.origin.name}</div>
            <div class="route-text-sub">${s.origin.address}</div>
            <div class="route-text-item">${s.destination.name}</div>
            <div class="route-text-sub">${s.destination.address}</div>
          </div>
        </div>
        <div class="shipment-card-bottom">
          <span>${s.date} • ${s.package.type}</span>
          <span class="shipment-price-tag">$${s.pricing.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }

  filterShipments(keyword) {
    const q = keyword.toLowerCase().trim();
    const container = document.getElementById('shipmentsListContainer');
    if (!container) return;

    const filtered = this.state.shipments.filter(s => 
      s.id.toLowerCase().includes(q) ||
      s.destination.name.toLowerCase().includes(q) ||
      s.destination.address.toLowerCase().includes(q) ||
      s.origin.name.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No matching shipments for "${keyword}".</div>`;
      return;
    }

    container.innerHTML = filtered.map(s => `
      <div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')">
        <div class="shipment-card-top">
          <span class="shipment-tracking-id">${s.id}</span>
          <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
        </div>
        <div class="shipment-route-summary">
          <div class="route-icons-column">
            <div class="route-dot-start"></div>
            <div class="route-connect-line"></div>
            <div class="route-dot-end"></div>
          </div>
          <div class="route-text-column">
            <div class="route-text-item">${s.origin.name}</div>
            <div class="route-text-sub">${s.origin.address}</div>
            <div class="route-text-item">${s.destination.name}</div>
            <div class="route-text-sub">${s.destination.address}</div>
          </div>
        </div>
        <div class="shipment-card-bottom">
          <span>${s.date} • ${s.package.weight} kg</span>
          <span class="shipment-price-tag">$${s.pricing.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }

  // ==========================================================================
  // VIEW: Real-time Live Tracking & Interactive GPS Map
  // ==========================================================================
  viewShipmentTracking(id) {
    this.selectedShipmentId = id;
    this.switchTab('track');
  }

  getTrackingHTML() {
    const s = this.state.shipments.find(item => item.id === this.selectedShipmentId) || this.state.shipments[0];
    const partner = this.state.partners.find(p => (p.id || p.partnerId) === s.assignedPartnerId) || this.state.partners[0] || { name: 'Unassigned', phone: '-', vehicle: 'Awaiting driver', rating: 0 };

    const timelineHTML = s.timeline.map((item, idx) => `
      <div class="timeline-item ${item.done ? 'completed' : ''} ${item.milestone === s.status ? 'active' : ''}">
        <div class="timeline-node">
          ${item.done ? `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          ` : `
            <div style="width:6px; height:6px; background:#cbd5e1; border-radius:50%;"></div>
          `}
        </div>
        <div class="timeline-info">
          <div class="timeline-title">
            <span>${item.milestone}</span>
            <span class="timeline-time">${item.time}</span>
          </div>
          <div class="timeline-desc">${item.location}</div>
        </div>
      </div>
    `).join('');

    return `
      <!-- Shipment Selector Dropdown -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-weight:700; font-size:0.95rem;">Track Shipment:</span>
        <select class="form-select" style="width:auto; padding:6px 12px; font-weight:700;" onchange="app.viewShipmentTracking(this.value)">
          ${this.state.shipments.map(item => `
            <option value="${item.id}" ${item.id === s.id ? 'selected' : ''}>${item.id} (${item.status})</option>
          `).join('')}
        </select>
      </div>

      <!-- Interactive Canvas GPS Map -->
      <div class="tracking-map-container">
        <canvas id="trackingCanvas"></canvas>
        <div class="map-floating-overlay">
          <div class="status-pulse-dot"></div>
          <span>Live GPS Satellite Feed • 60 FPS</span>
        </div>
        <div class="map-action-controls">
          <button class="map-mini-btn" onclick="app.triggerSimulateMovement()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ${this.simulatingVehicle ? 'Pause Beacon' : 'Simulate GPS Beacon'}
          </button>
          <button class="map-mini-btn" onclick="app.recenterMap()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
            Recenter
          </button>
        </div>
      </div>

      <!-- Live Tracking Status Card -->
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <span class="badge ${this.getBadgeClass(s.status)}" style="font-size:0.8rem; padding:4px 10px;">${s.status}</span>
            <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">ID: <strong style="font-family:monospace; color:#0f172a;">${s.id}</strong></div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.1rem; font-weight:800; color:#2563eb;">${s.eta}</div>
            <div style="font-size:0.72rem; color:#64748b;">${s.distanceRemainingKm} km remaining</div>
          </div>
        </div>

        <div style="background:#f8fafc; border-radius:8px; padding:10px; font-size:0.76rem; border:1px solid #e2e8f0;">
          <div style="margin-bottom:4px;"><strong>Destination:</strong> ${s.destination.name}</div>
          <div style="color:#64748b;">${s.destination.address}</div>
        </div>
      </div>

      <!-- Tracking Timeline -->
      <div class="card">
        <div style="font-weight:700; font-size:0.9rem; margin-bottom:12px; color:#1e293b;">Milestone Timeline</div>
        <div class="tracking-timeline">
          ${timelineHTML}
        </div>
      </div>

      <!-- Assigned Delivery Partner Card -->
      <div class="partner-contact-card">
        <div class="partner-avatar-img">🚚</div>
        <div class="partner-info">
          <div class="partner-name">${s.assignedPartnerId ? partner.name : 'Driver not assigned'}</div>
          <div class="partner-rating">${s.assignedPartnerId ? `★ ${partner.rating} • Dispatch Partner` : 'Awaiting dispatch assignment'}</div>
          <div class="partner-vehicle">${s.assignedPartnerId ? partner.vehicle : 'Select a driver from the Admin Dispatch Board'}</div>
        </div>
        ${s.assignedPartnerId ? `<div class="partner-actions">
          <button class="action-circle-btn" title="Call Driver" onclick="app.openCallModal('${partner.name}', '${partner.phone}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 0 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button class="action-circle-btn" title="Chat with Driver" onclick="app.openChatModal('${partner.name}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>` : ''}
      </div>

      <!-- Quick Actions (View Invoice / View POD) -->
      <div style="display:flex; gap:10px; margin-top:14px; margin-bottom:18px;">
        <button class="btn btn-secondary btn-block" onclick="app.openInvoiceModal('${s.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Digital Invoice
        </button>
        ${s.pod ? `
          <button class="btn btn-success btn-block" onclick="app.openProofOfDeliveryModal('${s.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            View POD
          </button>
        ` : ''}
      </div>
    `;
  }

  attachTrackingEvents() {
    // Canvas resize handling
    window.addEventListener('resize', () => this.renderInteractiveMap());
  }

  // ==========================================================================
  // High-Tech Canvas Vector GPS Map Rendering Engine
  // ==========================================================================
  renderInteractiveMap() {
    const canvas = document.getElementById('trackingCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    canvas.width = width;
    canvas.height = height;

    // Draw dark tech map background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw geometric grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Secondary arterial road networks
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.quadraticCurveTo(width * 0.5, height * 0.2, width, height * 0.6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.3, 0);
    ctx.quadraticCurveTo(width * 0.4, height * 0.7, width * 0.8, height);
    ctx.stroke();

    // Key transit hubs
    const hubs = [
      { x: width * 0.15, y: height * 0.75, name: 'SF Depot', code: 'HUB-01' },
      { x: width * 0.45, y: height * 0.48, name: 'San Mateo Checkpoint', code: 'HUB-02' },
      { x: width * 0.85, y: height * 0.25, name: 'San Jose Tech Park', code: 'DEST' }
    ];

    // Main Shipment Route Line (Neon Polyline)
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hubs[0].x, hubs[0].y);
    ctx.lineTo(hubs[1].x, hubs[1].y);
    ctx.lineTo(hubs[2].x, hubs[2].y);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(hubs[0].x, hubs[0].y);
    ctx.lineTo(hubs[1].x, hubs[1].y);
    ctx.lineTo(hubs[2].x, hubs[2].y);
    ctx.stroke();
    ctx.restore();

    // Draw Waypoint Hub Nodes
    hubs.forEach((hub, idx) => {
      // Glow circle
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#2563eb' : (idx === hubs.length - 1 ? '#10b981' : '#f59e0b');
      ctx.fill();

      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(hub.name, hub.x - 20, hub.y - 18);
    });

    // Calculate Vehicle Position along route based on this.simulationProgress
    const t = this.simulationProgress;
    let vx, vy;
    if (t <= 0.5) {
      const segT = t / 0.5;
      vx = hubs[0].x + (hubs[1].x - hubs[0].x) * segT;
      vy = hubs[0].y + (hubs[1].y - hubs[0].y) * segT;
    } else {
      const segT = (t - 0.5) / 0.5;
      vx = hubs[1].x + (hubs[2].x - hubs[1].x) * segT;
      vy = hubs[1].y + (hubs[2].y - hubs[1].y) * segT;
    }

    // Vehicle Radar Pulse Wave
    const pulseRadius = 14 + (Date.now() % 1000) / 40;
    ctx.beginPath();
    ctx.arc(vx, vy, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vehicle Courier Icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(vx, vy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SF', vx, vy);
    ctx.restore();

    // Vehicle Label Tooltip
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect ? ctx.roundRect(vx - 50, vy + 18, 100, 22, 4) : ctx.fillRect(vx - 50, vy + 18, 100, 22);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('🚚 Marcus Cole (48 km/h)', vx, vy + 32);
  }

  triggerSimulateMovement() {
    this.simulatingVehicle = !this.simulatingVehicle;
    if (this.simulatingVehicle) {
      this.showToast('Live GPS Simulator Active: Courier Beacon Moving', 'info');
      this.runSimulationLoop();
    } else {
      this.showToast('GPS Beacon simulation paused', 'warning');
      if (this.mapAnimFrame) cancelAnimationFrame(this.mapAnimFrame);
    }
  }

  runSimulationLoop() {
    if (!this.simulatingVehicle) return;

    this.simulationProgress += 0.003;
    if (this.simulationProgress > 0.95) {
      this.simulationProgress = 0.15; // loop back
    }

    this.renderInteractiveMap();
    this.mapAnimFrame = requestAnimationFrame(() => this.runSimulationLoop());
  }

  recenterMap() {
    this.simulationProgress = 0.55;
    this.renderInteractiveMap();
    this.showToast('Map recentered to courier GPS coordinates', 'info');
  }

  startLiveSimulationTimer() {
    // Subtle background tick for live time in mobile status bar
    setInterval(() => {
      const timeEl = document.getElementById('mobileLiveTime');
      if (timeEl) {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }, 1000);
  }

  // ==========================================================================
  // VIEW: Delivery Partner Console (Driver Mode)
  // ==========================================================================
  getPartnerHTML() {
    const partner = this.state.partners[0] || { id: 'drv_01', partnerId: 'drv_01', name: 'Driver Partner', vehicle: 'Vehicle', rating: 0, phone: '-' };
    const partnerId = partner.partnerId || partner.id;
    const assignedShipments = this.state.shipments.filter(s => s.assignedPartnerId === partnerId);
    const activeJob = assignedShipments.find(s => s.status !== 'Delivered' && s.status !== 'Cancelled') || assignedShipments[0];

    return `
      <!-- Shift Header Card -->
      <div style="background:linear-gradient(135deg, #1e293b, #0f172a); border-radius:14px; padding:16px; color:#fff; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <div style="font-size:1.1rem; font-weight:800;">${partner.name}</div>
            <div style="font-size:0.75rem; color:#94a3b8;">${partner.vehicle}</div>
          </div>
          <div style="background:rgba(16, 185, 129, 0.2); border:1px solid #10b981; color:#34d399; font-weight:700; font-size:0.75rem; padding:4px 10px; border-radius:20px; display:flex; align-items:center; gap:6px;">
            <div style="width:6px; height:6px; background:#10b981; border-radius:50%;"></div>
            ONLINE & DISPATCHABLE
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px; text-align:center;">
          <div>
            <div style="font-size:1.1rem; font-weight:800;">$248.50</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Today's Payout</div>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:800;">5</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Drops Today</div>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:800; color:#fbbf24;">★ 4.92</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Rating</div>
          </div>
        </div>
      </div>

      <!-- Active Job In-Progress -->
      ${activeJob ? `
        <div class="section-title">
          <span>Active Assignment (${activeJob.id})</span>
          <span class="badge ${this.getBadgeClass(activeJob.status)}">${activeJob.status}</span>
        </div>

        <div class="card" style="border-left:4px solid #2563eb;">
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span style="font-weight:700; font-size:0.86rem; color:#1e293b;">Deliver to: ${activeJob.destination.name}</span>
            <span style="font-weight:700; color:#2563eb;">$${activeJob.pricing.total.toFixed(2)}</span>
          </div>

          <div style="font-size:0.78rem; color:#475569; margin-bottom:12px;">
            📍 <strong>Address:</strong> ${activeJob.destination.address}<br>
            📞 <strong>Receiver:</strong> ${activeJob.destination.contact}<br>
            📦 <strong>Package:</strong> ${activeJob.package.type} (${activeJob.package.weight} kg)
          </div>

          <!-- Quick Navigation Link -->
          <div style="background:#eff6ff; padding:10px; border-radius:8px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.78rem; color:#1e40af;">
              <strong>GPS Route:</strong> Highway 101 South (Light Traffic)<br>
              Distance: ${activeJob.distanceRemainingKm} km • ETA: ${activeJob.eta}
            </div>
            <button class="btn btn-primary btn-sm" onclick="app.viewShipmentTracking('${activeJob.id}')">
              Turn-by-Turn Map
            </button>
          </div>

          <!-- Driver Action Progression Buttons -->
          <div style="font-weight:700; font-size:0.82rem; margin-bottom:8px; color:#1e293b;">Update Shipment Status:</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${(() => {
              const idx = SHIPMENT_STATUS_INDEX[activeJob.status] ?? 0;
              const next = SHIPMENT_LIFECYCLE[idx + 1];
              if (!next || next === 'Delivered') return '';
              return `<button class="btn btn-primary btn-sm" onclick="app.partnerUpdateStatus('${activeJob.id}', '${next}')">Mark ${next}</button>`;
            })()}
            ${activeJob.status === 'Out for Delivery' ? `<button class="btn btn-success btn-sm" onclick="app.openPODCaptureModal('${activeJob.id}')">✍️ Deliver & POD</button>` : ''}
          </div>
        </div>
      ` : `
        <div class="card" style="text-align:center; padding:30px; color:#64748b;">
          🎉 All assigned deliveries completed! Standing by for dispatch queue.
        </div>
      `}

      <!-- Driver Delivery Queue -->
      <div class="section-title" style="margin-top:18px;">
        <span>Assigned Delivery Manifest</span>
        <span style="font-size:0.78rem; color:#64748b;">${assignedShipments.length} Orders</span>
      </div>

      <div>
        ${assignedShipments.map(s => `
          <div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')">
            <div class="shipment-card-top">
              <span class="shipment-tracking-id">${s.id}</span>
              <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
            </div>
            <div style="font-size:0.82rem; font-weight:600; color:#1e293b; margin-bottom:4px;">${s.destination.name}</div>
            <div style="font-size:0.72rem; color:#64748b; margin-bottom:8px;">${s.destination.address}</div>
            <div class="shipment-card-bottom">
              <span>Payout: $${(s.pricing.total * 0.7).toFixed(2)} (70% share)</span>
              <span style="color:#2563eb; font-weight:600;">Details →</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachPartnerEvents() {}

  async partnerUpdateStatus(id, newStatus) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s) return;
    const currentIdx = SHIPMENT_STATUS_INDEX[s.status] ?? 0;
    if (SHIPMENT_STATUS_INDEX[newStatus] !== currentIdx + 1) {
      this.showToast(`Next valid step is ${SHIPMENT_LIFECYCLE[currentIdx + 1] || 'Delivery'}.`, 'warning');
      return;
    }
    normalizeShipmentLifecycle(s);
    s.status = newStatus;
    s.timeline = SHIPMENT_LIFECYCLE.map((milestone, i) => ({ ...s.timeline[i], milestone, done: i <= SHIPMENT_STATUS_INDEX[newStatus], time: i === SHIPMENT_STATUS_INDEX[newStatus] ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : s.timeline[i].time }));
    this.state.notifications.unshift({ id: 'ntf_' + Date.now(), title: `Status: ${newStatus}`, message: `Shipment ${id} moved to ${newStatus}.`, time: 'Just now', type: 'delivery', read: false });
    this.persist();
    const remote = await ShipFlowAPI.updateStatus(id, newStatus);
    if (remote?.success && remote.data) this.state.shipments[this.state.shipments.findIndex(x => x.id === id)] = normalizeShipmentLifecycle(remote.data);
    this.persist();
    this.renderCurrentView();
    this.showToast(`Updated ${id} to "${newStatus}"!`, 'success');
  }

  // ==========================================================================
  // VIEW: Admin Operations Management Dashboard
  // ==========================================================================
  getAdminHTML() {
    const shipments = this.state.shipments.map(normalizeShipmentLifecycle);
    const partners = this.state.partners;
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    const inTransit = shipments.filter(s => ['In Transit', 'Out for Delivery'].includes(s.status)).length;
    const pending = shipments.filter(s => ['Created', 'Confirmed', 'Assigned'].includes(s.status)).length;
    const activeDrivers = partners.filter(p => p.status === 'Online' || p.status === 'Busy').length;
    const revenue = shipments.reduce((sum, s) => sum + Number(s.pricing?.total || 0), 0);
    const openTickets = this.state.supportTickets.filter(t => t.status === 'Open').length;
    const statusCounts = SHIPMENT_LIFECYCLE.map(status => ({ status, count: shipments.filter(s => s.status === status).length }));
    const maxCount = Math.max(1, ...statusCounts.map(x => x.count));
    const recent = shipments.slice(0, 5);

    return `
      <div class="section-title"><span>Operations Analytics</span><span style="font-size:0.72rem;color:#64748b;">Live MongoDB dataset</span></div>
      <div class="kpi-grid">
        ${[
          ['Total Shipments', total, 'All orders in system', 'kpi-icon-blue'],
          ['In Transit', inTransit, 'In Transit + Out for Delivery', 'kpi-icon-purple'],
          ['Delivered', delivered, `${total ? Math.round(delivered / total * 100) : 0}% of shipments`, 'kpi-icon-green'],
          ['Pending', pending, 'Created / Confirmed / Assigned', 'kpi-icon-amber'],
          ['Active Drivers', activeDrivers, `${partners.filter(p => p.status === 'Busy').length} currently busy`, 'kpi-icon-blue'],
          ['Gross Revenue', `$${revenue.toFixed(2)}`, 'Shipment value', 'kpi-icon-green']
        ].map(([label, value, sub, icon]) => `<div class="kpi-card"><div class="kpi-card-header"><span class="kpi-label">${label}</span><div class="kpi-icon-box ${icon}">●</div></div><div class="kpi-value">${value}</div><div style="font-size:0.68rem;color:#64748b;font-weight:600;">${sub}</div></div>`).join('')}
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><strong>Lifecycle Distribution</strong><span style="font-size:0.7rem;color:#64748b;">Created → Delivered</span></div>
        <div style="display:grid;gap:9px;">
          ${statusCounts.map(x => `<div style="display:grid;grid-template-columns:92px 1fr 28px;gap:8px;align-items:center;font-size:0.7rem;"><span>${x.status}</span><div style="height:9px;background:#e2e8f0;border-radius:20px;overflow:hidden;"><div style="height:100%;width:${Math.round(x.count/maxCount*100)}%;background:#2563eb;border-radius:20px;"></div></div><strong>${x.count}</strong></div>`).join('')}
        </div>
      </div>

      <div class="section-title"><span>Dispatch Board</span><span style="font-size:0.72rem;color:#64748b;">Assign drivers & advance status</span></div>
      <div style="margin-bottom:18px;">
        ${recent.map(s => `
          <div class="card" style="padding:12px;margin-bottom:9px;">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px;">
              <div><strong>${s.id}</strong><div style="font-size:0.7rem;color:#64748b;">${s.origin.name} → ${s.destination.name}</div></div>
              <span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
              <select class="form-select" ${((SHIPMENT_STATUS_INDEX[s.status] ?? 0) > SHIPMENT_STATUS_INDEX.Assigned) ? 'disabled' : ''} onchange="app.assignShipment('${s.id}', this.value)">
                <option value="">${s.assignedPartnerId ? 'Change Driver' : 'Assign Driver'}</option>
                ${partners.map(p => `<option value="${p.partnerId || p.id}" ${(p.partnerId || p.id) === s.assignedPartnerId ? 'selected' : ''}>${p.name} • ${p.status}</option>`).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" onclick="app.advanceShipmentStatus('${s.id}')">Advance to Next</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-title"><span>Recent Shipments</span><span style="font-size:0.72rem;color:#64748b;">${recent.length} shown</span></div>
      <div style="margin-bottom:18px;">
        ${recent.map(s => `<div class="shipment-card" onclick="app.openShipmentDetail('${s.id}')"><div class="shipment-card-top"><span class="shipment-tracking-id">${s.id}</span><span class="badge ${this.getBadgeClass(s.status)}">${s.status}</span></div><div style="font-size:0.75rem;color:#64748b;">${s.destination.name} • ${s.package.weight} kg</div><div class="shipment-card-bottom"><span>${s.assignedPartnerId ? `Driver: ${this.state.partners.find(p => (p.partnerId || p.id) === s.assignedPartnerId)?.name || s.assignedPartnerId}` : 'Driver unassigned'}</span><span class="shipment-price-tag">$${Number(s.pricing?.total || 0).toFixed(2)}</span></div></div>`).join('')}
      </div>

      <div class="section-title"><span>Fleet Overview</span><span style="font-size:0.72rem;color:#64748b;">${activeDrivers} active</span></div>
      <div style="margin-bottom:18px;">${partners.map(p => `<div class="card" style="padding:11px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;"><div><strong style="font-size:0.82rem;">${p.name}</strong><div style="font-size:0.7rem;color:#64748b;">${p.vehicle} • ${p.deliveriesCompleted || 0} completed</div></div><span class="badge ${p.status === 'Busy' ? 'badge-out-delivery' : 'badge-delivered'}">${p.status}</span></div>`).join('')}</div>

      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><strong>Support Desk</strong><span class="badge ${openTickets ? 'badge-pending' : 'badge-delivered'}">${openTickets} Open</span></div></div>

      <div class="card">
        <div style="font-weight:700;font-size:0.9rem;margin-bottom:12px;color:#1e293b;display:flex;justify-content:space-between;"><span>Dynamic Pricing Rules</span><button class="btn btn-primary btn-sm" onclick="app.savePricingRules()">Save Rules</button></div>
        <div class="form-row-2"><div class="form-group"><label class="form-label">Base Freight Fee ($)</label><input type="number" class="form-input" id="cfgBaseFee" value="${this.state.pricingRules.baseFee}"></div><div class="form-group"><label class="form-label">Per Kg Rate ($/kg)</label><input type="number" step="0.1" class="form-input" id="cfgPerKg" value="${this.state.pricingRules.perKgRate}"></div></div>
        <div class="form-row-2"><div class="form-group"><label class="form-label">Fuel Surcharge (%)</label><input type="number" step="0.5" class="form-input" id="cfgFuel" value="${this.state.pricingRules.fuelSurchargePct}"></div><div class="form-group"><label class="form-label">Logistics Tax (%)</label><input type="number" step="0.5" class="form-input" id="cfgTax" value="${this.state.pricingRules.taxPct}"></div></div>
      </div>
    `;
  }

  async assignShipment(id, partnerId) {
    if (!partnerId) return;
    const shipment = this.state.shipments.find(s => s.id === id);
    if (!shipment) return;
    const partner = this.state.partners.find(p => (p.partnerId || p.id) === partnerId);
    if (!partner) return;
    shipment.assignedPartnerId = partnerId;
    normalizeShipmentLifecycle(shipment);
    shipment.status = 'Assigned';
    shipment.timeline = SHIPMENT_LIFECYCLE.map((milestone, i) => ({ ...shipment.timeline[i], milestone, done: i <= SHIPMENT_STATUS_INDEX.Assigned, time: i === SHIPMENT_STATUS_INDEX.Assigned ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : shipment.timeline[i].time, location: i === SHIPMENT_STATUS_INDEX.Assigned ? (partner.currentLocation || partner.name) : shipment.timeline[i].location }));
    partner.status = 'Busy';
    this.persist();
    const remote = await ShipFlowAPI.assignShipment(id, partnerId);
    if (remote?.success && remote.data) {
      this.state.shipments[this.state.shipments.findIndex(s => s.id === id)] = normalizeShipmentLifecycle(remote.data);
      this.persist();
      this.renderCurrentView();
      this.showToast(`${partner.name} assigned to ${id}.`, 'success');
    } else {
      await this.syncWithMongoDB(false);
      this.showToast(remote?.message || 'Driver assignment failed. Check the shipment lifecycle.', 'warning');
    }
  }

  async advanceShipmentStatus(id) {
    const shipment = this.state.shipments.find(s => s.id === id);
    if (!shipment) return;
    const idx = SHIPMENT_STATUS_INDEX[shipment.status] ?? 0;
    const next = SHIPMENT_LIFECYCLE[idx + 1];
    if (!next) { this.showToast('Shipment is already at the final lifecycle stage.', 'info'); return; }
    if (next === 'Assigned' && !shipment.assignedPartnerId) { this.showToast('Assign a driver before moving to Assigned.', 'warning'); return; }
    if (next === 'Delivered') { this.showToast('Use the driver POD flow to mark delivery complete.', 'info'); return; }
    await this.partnerUpdateStatus(id, next);
  }

  attachAdminEvents() {}

  savePricingRules() {
    const base = Number(document.getElementById('cfgBaseFee').value) || 25;
    const perKg = Number(document.getElementById('cfgPerKg').value) || 2.8;
    const fuel = Number(document.getElementById('cfgFuel').value) || 6.5;
    const tax = Number(document.getElementById('cfgTax').value) || 5.0;

    this.state.pricingRules.baseFee = base;
    this.state.pricingRules.perKgRate = perKg;
    this.state.pricingRules.fuelSurchargePct = fuel;
    this.state.pricingRules.taxPct = tax;

    this.persist();
    ShipFlowAPI.updatePricing(this.state.pricingRules);
    this.showToast('Global pricing rates updated & synced with MongoDB!', 'success');
  }

  resolveTicket(ticketId) {
    const t = this.state.supportTickets.find(item => item.id === ticketId);
    if (!t) return;
    t.status = t.status === 'Open' ? 'Resolved' : 'Open';
    this.persist();
    this.renderCurrentView();
    this.showToast(`Ticket ${ticketId} status set to ${t.status}`, 'info');
  }

  // ==========================================================================
  // VIEW: Notifications Screen
  // ==========================================================================
  getNotificationsHTML() {
    const notifs = this.state.notifications;

    return `
      <div class="section-title">
        <span>Notification Inbox</span>
        <button class="btn btn-secondary btn-sm" onclick="app.markAllNotificationsRead()">Mark all read</button>
      </div>

      <div style="margin-bottom:12px;">
        <button class="btn btn-primary btn-sm btn-block" onclick="app.triggerDemoPushNotification()">
          🔔 Simulate Incoming Delivery Push Alert
        </button>
      </div>

      <div>
        ${notifs.map(n => `
          <div class="card" style="padding:12px; margin-bottom:8px; border-left:4px solid ${n.read ? '#cbd5e1' : '#2563eb'}; background:${n.read ? '#ffffff' : '#f8faff'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
              <span style="font-weight:700; font-size:0.84rem; color:#0f172a;">${n.title}</span>
              <span style="font-size:0.7rem; color:#94a3b8;">${n.time}</span>
            </div>
            <div style="font-size:0.76rem; color:#475569; line-height:1.4;">${n.message}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachNotificationsEvents() {}

  markAllNotificationsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.persist();
    this.renderCurrentView();
    this.showToast('All notifications marked as read', 'info');
  }

  triggerDemoPushNotification() {
    const activeShipment = this.state.shipments[0];
    const newNotif = {
      id: 'ntf_' + Date.now(),
      title: 'Courier Approaching Consignee',
      message: `Driver Marcus Cole is 5 minutes away from destination for ${activeShipment.id}. Please have receiving staff ready.`,
      time: 'Just now',
      type: 'delivery',
      read: false
    };
    this.state.notifications.unshift(newNotif);
    this.persist();
    this.renderCurrentView();
    this.showToast(newNotif.message, 'info');
  }

  // ==========================================================================
  // VIEW: Shipper Profile & Company Settings
  // ==========================================================================
  getProfileHTML() {
    const u = this.state.currentUser;

    return `
      <!-- User Profile Header -->
      <div style="text-align:center; padding:20px 10px; margin-bottom:14px;">
        <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff; font-size:1.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto; box-shadow:0 8px 20px rgba(37,99,235,0.3);">
          AV
        </div>
        <div style="font-size:1.2rem; font-weight:800; color:#0f172a;">${u.name}</div>
        <div style="font-size:0.8rem; color:#64748b;">${u.company}</div>
        <span class="badge badge-delivered" style="margin-top:6px;">KYC Enterprise Verified</span>
      </div>

      <!-- Quick Balance Card -->
      <div class="card" style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#fff;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">Prepaid Freight Account Balance</div>
        <div style="font-size:1.6rem; font-weight:800; color:#38bdf8; margin-bottom:12px;">$${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="app.addFundsModal()">+ Add Funds</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="app.switchTab('shipments')">Statements</button>
        </div>
      </div>

      <!-- Saved Addresses Directory -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-weight:700; font-size:0.88rem; color:#0f172a;">Saved Address Book</span>
          <span style="font-size:0.75rem; color:#2563eb; font-weight:600; cursor:pointer;" onclick="app.showToast('Address book synced with ERP', 'info')">+ Add Address</span>
        </div>
        ${this.state.savedAddresses.map(addr => `
          <div style="border-bottom:1px solid #f1f5f9; padding:8px 0;">
            <div style="font-weight:700; font-size:0.8rem; color:#0f172a;">${addr.title}</div>
            <div style="font-size:0.72rem; color:#64748b;">${addr.address}</div>
          </div>
        `).join('')}
      </div>

      <!-- Notification Settings -->
      <div class="card">
        <div style="font-weight:700; font-size:0.88rem; color:#0f172a; margin-bottom:12px;">Alert & SMS Preferences</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.8rem;">
          <span>Instant Push Notifications</span>
          <input type="checkbox" checked>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:0.8rem;">
          <span>SMS Driver Arrival Alerts</span>
          <input type="checkbox" checked>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
          <span>Electronic Invoices by Email</span>
          <input type="checkbox" checked>
        </div>
      </div>

      <!-- Help & Support Button -->
      <div style="margin-bottom:20px;">
        <button class="btn btn-secondary btn-block" style="margin-bottom:8px;" onclick="app.openSupportModal()">
          💬 Contact ShipFlow 24/7 Logistics Support
        </button>
        <button class="btn btn-danger btn-block" onclick="app.showToast('Logged out of session', 'warning')">
          Log Out
        </button>
      </div>
    `;
  }

  attachProfileEvents() {}

  addFundsModal() {
    this.state.currentUser.balance += 5000;
    this.persist();
    this.renderCurrentView();
    this.showToast('Deposited $5,000.00 to ShipFlow Prepaid Balance!', 'success');
  }

  // ==========================================================================
  // MODALS & OVERLAYS
  // ==========================================================================
  openShipmentDetail(id) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s) return;

    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = `Shipment ${s.id}`;
    body.innerHTML = `
      <div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <span class="badge ${this.getBadgeClass(s.status)}" style="font-size:0.82rem; padding:4px 10px;">${s.status}</span>
        <span style="font-size:1.1rem; font-weight:800; color:#2563eb;">$${s.pricing.total.toFixed(2)}</span>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:12px;">
        <div style="font-size:0.72rem;color:#64748b;margin-bottom:6px;">Shipment lifecycle</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">${SHIPMENT_LIFECYCLE.map((stage,i)=>`<span style="font-size:0.64rem;padding:4px 7px;border-radius:999px;background:${i <= (SHIPMENT_STATUS_INDEX[s.status] ?? 0) ? '#dbeafe' : '#e2e8f0'};color:${i <= (SHIPMENT_STATUS_INDEX[s.status] ?? 0) ? '#1d4ed8' : '#64748b'};font-weight:700;">${i+1}. ${stage}</span>`).join('')}</div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px; font-size:0.78rem;">
        <div style="margin-bottom:6px;"><strong>Origin:</strong> ${s.origin.name} (${s.origin.address})</div>
        <div><strong>Destination:</strong> ${s.destination.name} (${s.destination.address})</div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:14px; font-size:0.78rem;">
        <div style="margin-bottom:4px;"><strong>Package Type:</strong> ${s.package.type}</div>
        <div style="margin-bottom:4px;"><strong>Weight & Dimensions:</strong> ${s.package.weight} kg • ${s.package.dimensions}</div>
        <div style="margin-bottom:4px;"><strong>Declared Cargo Value:</strong> $${s.package.declaredValue}</div>
        <div><strong>Description:</strong> ${s.package.description}</div>
      </div>

      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary btn-block" onclick="app.closeModal(); app.viewShipmentTracking('${s.id}')">
          Open Live Tracker
        </button>
        <button class="btn btn-secondary btn-block" onclick="app.openInvoiceModal('${s.id}')">
          Invoice
        </button>
      </div>

      ${s.pod ? `
        <div style="margin-top:10px;">
          <button class="btn btn-success btn-block" onclick="app.openProofOfDeliveryModal('${s.id}')">
            View Signed Proof of Delivery
          </button>
        </div>
      ` : ''}
    `;

    modal.classList.add('active');
  }

  // Digital Invoice Modal
  openInvoiceModal(id) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s) return;

    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = 'Commercial Tax Invoice';
    body.innerHTML = `
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="invoice-company-logo">
            <span style="background:#2563eb; color:#fff; width:28px; height:28px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; font-size:0.85rem;">SF</span>
            ShipFlow Global
          </div>
          <div style="text-align:right; font-size:0.75rem; color:#64748b;">
            <div><strong>Invoice:</strong> ${s.invoiceId}</div>
            <div><strong>Date:</strong> ${s.date}</div>
            <div><span class="badge badge-delivered">PAID</span></div>
          </div>
        </div>

        <div class="invoice-bill-parties">
          <div>
            <div class="party-title">Consignor (Shipper)</div>
            <div class="party-name">${s.origin.name}</div>
            <div style="color:#64748b; font-size:0.72rem;">${s.origin.address}</div>
          </div>
          <div>
            <div class="party-title">Consignee (Receiver)</div>
            <div class="party-name">${s.destination.name}</div>
            <div style="color:#64748b; font-size:0.72rem;">${s.destination.address}</div>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Freight Charge (${s.package.type})</td>
              <td style="text-align:right;">$${s.pricing.base.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Weight Charge (${s.package.weight} kg)</td>
              <td style="text-align:right;">$${s.pricing.weightCharge.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Priority Handling (${s.priority.toUpperCase()})</td>
              <td style="text-align:right;">$${s.pricing.prioritySurcharge.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Fuel Surcharge (6.5%)</td>
              <td style="text-align:right;">$${s.pricing.fuelSurcharge.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Cargo Insurance Protection</td>
              <td style="text-align:right;">$${s.pricing.insurance.toFixed(2)}</td>
            </tr>
            <tr>
              <td>State Freight Tax (5.0%)</td>
              <td style="text-align:right;">$${s.pricing.tax.toFixed(2)}</td>
            </tr>
            <tr style="font-weight:800; font-size:0.95rem; border-top:2px solid #0f172a;">
              <td>Total Amount Paid (USD)</td>
              <td style="text-align:right; color:#2563eb;">$${s.pricing.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-barcode">
          <div class="barcode-stripes"></div>
          <span style="font-family:monospace; font-size:0.75rem; letter-spacing:2px;">*${s.id}*</span>
        </div>
      </div>

      <div style="margin-top:14px; display:flex; gap:8px;">
        <button class="btn btn-primary btn-block" onclick="window.print()">
          Print / PDF
        </button>
        <button class="btn btn-secondary btn-block" onclick="app.closeModal()">
          Close
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  // Digital Proof of Delivery Viewer
  openProofOfDeliveryModal(id) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s || !s.pod) return;

    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = 'Digital Proof of Delivery (POD)';
    body.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #10b981; border-radius:10px; padding:12px; margin-bottom:14px; font-size:0.8rem; color:#065f46;">
        ✓ <strong>Delivery Officially Verified:</strong> Timestamped on ${s.pod.timestamp}.
      </div>

      <div style="margin-bottom:12px; font-size:0.8rem;">
        <div><strong>Recipient Full Name:</strong> ${s.pod.receiverName}</div>
        <div><strong>Confirmation Passcode:</strong> ${s.pod.confirmationCode}</div>
      </div>

      <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px; color:#1e293b;">Electronic Signature:</div>
      <div style="border:1px solid #cbd5e1; border-radius:8px; padding:10px; text-align:center; background:#fff; margin-bottom:14px;">
        <img src="${s.pod.signature}" alt="Signature" style="max-height:80px; max-width:100%;">
      </div>

      <div style="font-weight:700; font-size:0.8rem; margin-bottom:6px; color:#1e293b;">Delivery Photo Evidence:</div>
      <div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; text-align:center; background:#f8fafc; margin-bottom:14px;">
        <img src="${s.pod.photoUrl}" alt="Photo Proof" style="width:100%; max-height:180px; object-fit:cover;">
      </div>

      <button class="btn btn-secondary btn-block" onclick="app.closeModal()">Close POD</button>
    `;

    modal.classList.add('active');
  }

  // Digital Proof of Delivery Capture Pad (Used by Delivery Partner)
  openPODCaptureModal(id) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s) return;

    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = 'Complete Delivery & Capture POD';
    body.innerHTML = `
      <div style="font-size:0.78rem; color:#64748b; margin-bottom:12px;">
        Complete handover for <strong>${s.id}</strong> to recipient at <em>${s.destination.name}</em>.
      </div>

      <div class="form-group">
        <label class="form-label">Receiver Signer Name *</label>
        <input type="text" class="form-input" id="inpPodReceiverName" value="David Miller (Operations Reception)">
      </div>

      <div class="form-group">
        <label class="form-label">Receiver 4-Digit Handover Code *</label>
        <input type="text" class="form-input" id="inpPodCode" value="4821" style="font-family:monospace; font-size:1.1rem; letter-spacing:4px;">
      </div>

      <label class="form-label">Customer Signature Pad (Sign Below)</label>
      <div class="signature-box-wrap">
        <canvas id="signaturePad"></canvas>
        <div class="signature-placeholder" id="sigPlaceholder">✍️ Tap or drag to sign here</div>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
        <button class="btn btn-secondary btn-sm" onclick="app.clearSignature()">Clear Signature</button>
      </div>

      <label class="form-label">Photo Proof of Delivery</label>
      <div class="photo-proof-upload" id="photoProofBox" onclick="app.simulatePhotoProofCapture()">
        <div id="photoProofPreview">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 4px auto; color:#64748b;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          <div style="font-size:0.75rem; color:#64748b;">Tap to capture / upload delivery parcel photo</div>
        </div>
      </div>

      <button class="btn btn-success btn-block" style="padding:14px; font-size:0.95rem;" onclick="app.submitDeliveryProof('${s.id}')">
        ✓ Confirm Handover & Complete Delivery
      </button>
    `;

    modal.classList.add('active');
    setTimeout(() => this.initSignaturePad(), 150);
  }

  initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 160;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;

    const start = (e) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const placeholder = document.getElementById('sigPlaceholder');
      if (placeholder) placeholder.style.display = 'none';
    };

    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stop);
  }

  clearSignature() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const placeholder = document.getElementById('sigPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
  }

  simulatePhotoProofCapture() {
    const preview = document.getElementById('photoProofPreview');
    if (preview) {
      preview.innerHTML = `
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80" style="width:100%; height:120px; object-fit:cover; border-radius:6px;">
        <div style="font-size:0.72rem; color:#10b981; font-weight:700; margin-top:4px;">✓ Photo Captured: Handover at Front Dock</div>
      `;
    }
    this.showToast('Delivery parcel photo verified and attached!', 'success');
  }

  submitDeliveryProof(id) {
    const s = this.state.shipments.find(item => item.id === id);
    if (!s) return;

    const rName = document.getElementById('inpPodReceiverName').value || 'David Miller';
    const code = document.getElementById('inpPodCode').value || '4821';
    const canvas = document.getElementById('signaturePad');
    const signatureData = canvas ? canvas.toDataURL() : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,40 Q40,10 70,40 T130,20 T180,45" fill="none" stroke="%232563eb" stroke-width="3"/></svg>';

    s.status = 'Delivered';
    s.eta = 'Delivered';
    s.distanceRemainingKm = 0;
    s.pod = {
      receiverName: rName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      signature: signatureData,
      confirmationCode: code,
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
    };

    s.timeline.forEach(t => t.done = true);
    const deliveredTimeline = s.timeline.find(t => t.milestone === 'Delivered');
    if (deliveredTimeline) {
      deliveredTimeline.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    this.state.notifications.unshift({
      id: 'ntf_' + Date.now(),
      title: 'Package Delivered & Signed',
      message: `Shipment ${id} was safely delivered to ${rName}. Signed Proof of Delivery uploaded.`,
      time: 'Just now',
      type: 'success',
      read: false
    });

    this.persist();
    this.closeModal();
    this.renderCurrentView();

    // Persist POD to MongoDB
    ShipFlowAPI.submitPOD(id, s.pod);

    this.showToast(`Delivery ${id} completed! Digital POD generated.`, 'success');
  }

  // Direct Driver Call Modal
  openCallModal(name, phone) {
    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = 'Calling Courier';
    body.innerHTML = `
      <div style="text-align:center; padding:20px 10px;">
        <div style="width:72px; height:72px; border-radius:50%; background:#eff6ff; color:#2563eb; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 14px auto;">
          🚚
        </div>
        <div style="font-size:1.15rem; font-weight:800; color:#0f172a;">${name}</div>
        <div style="font-size:0.85rem; color:#64748b; margin-bottom:14px;">${phone}</div>
        <div style="font-size:0.75rem; color:#10b981; font-weight:700;">● Secure In-App Encrypted Line Connected</div>

        <div style="margin-top:24px;">
          <button class="btn btn-danger btn-block" style="padding:14px;" onclick="app.closeModal()">
            End Call
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // Live Driver In-App Chat Modal
  openChatModal(driverName) {
    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = `Chat with ${driverName}`;
    body.innerHTML = `
      <div class="chat-messages-box" id="chatBox">
        <div class="chat-bubble incoming">
          Hello Alex! I am currently on Route 101 South heading to your drop-off in San Jose.
        </div>
        <div class="chat-bubble incoming">
          Estimated arrival is 28 minutes. Let me know if you need dock assistance!
        </div>
      </div>

      <div style="display:flex; gap:6px; margin-bottom:8px; overflow-x:auto; padding-bottom:4px;">
        <button class="btn btn-secondary btn-sm" onclick="app.sendChatMessage('Ring front bell on arrival')">Ring front bell</button>
        <button class="btn btn-secondary btn-sm" onclick="app.sendChatMessage('Leave at dock 3')">Leave at dock 3</button>
        <button class="btn btn-secondary btn-sm" onclick="app.sendChatMessage('Is cold chain stable?')">Cold chain temp?</button>
      </div>

      <div style="display:flex; gap:6px;">
        <input type="text" class="form-input" id="chatInput" placeholder="Type a message to driver...">
        <button class="btn btn-primary" onclick="app.sendChatMessageFromInput()">Send</button>
      </div>
    `;

    modal.classList.add('active');
  }

  sendChatMessageFromInput() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    this.sendChatMessage(input.value.trim());
    input.value = '';
  }

  sendChatMessage(text) {
    const box = document.getElementById('chatBox');
    if (!box) return;

    box.innerHTML += `<div class="chat-bubble outgoing">${text}</div>`;
    box.scrollTop = box.scrollHeight;

    // Simulate smart driver reply after 900ms
    setTimeout(() => {
      let reply = "Copy that! Updated in delivery notes.";
      if (text.toLowerCase().includes('cold chain') || text.toLowerCase().includes('temp')) {
        reply = "Refrigeration telemetry active at -19.4°C. Perfect condition!";
      } else if (text.toLowerCase().includes('dock')) {
        reply = "Will pull straight up to Dock 3.";
      }
      box.innerHTML += `<div class="chat-bubble incoming">${reply}</div>`;
      box.scrollTop = box.scrollHeight;
    }, 900);
  }

  openSupportModal() {
    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    title.innerText = 'Logistics Support Desk';
    body.innerHTML = `
      <div style="font-size:0.8rem; color:#64748b; margin-bottom:12px;">
        Submit a priority ticket directly to our 24/7 Supply Chain Dispatch Command.
      </div>

      <div class="form-group">
        <label class="form-label">Subject / Issue Type</label>
        <input type="text" class="form-input" id="inpSupportSubject" placeholder="e.g. Temperature audit or gate pass code">
      </div>

      <div class="form-group">
        <label class="form-label">Related Shipment ID (Optional)</label>
        <input type="text" class="form-input" id="inpSupportShipment" value="SF-892401">
      </div>

      <div class="form-group">
        <label class="form-label">Message Details</label>
        <textarea class="form-textarea" id="inpSupportMsg" rows="3" placeholder="Describe the inquiry..."></textarea>
      </div>

      <button class="btn btn-primary btn-block" onclick="app.submitSupportTicket()">
        Submit Priority Ticket
      </button>
    `;

    modal.classList.add('active');
  }

  submitSupportTicket() {
    const subj = document.getElementById('inpSupportSubject').value || 'General Inquiry';
    const msg = document.getElementById('inpSupportMsg').value || 'Assistance requested.';

    const newTicket = {
      id: 'TCK-' + Math.floor(4000 + Math.random() * 900),
      subject: subj,
      shipper: this.state.currentUser.name + ' (' + this.state.currentUser.company + ')',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Open',
      priority: 'High',
      messages: [
        { sender: this.state.currentUser.name, time: 'Just now', text: msg }
      ]
    };

    this.state.supportTickets.unshift(newTicket);
    this.persist();
    this.closeModal();

    // Persist ticket to MongoDB
    ShipFlowAPI.createTicket(newTicket);

    this.showToast(`Support Ticket ${newTicket.id} created! Dispatch will reply shortly.`, 'success');
  }

  // ==========================================================================
  // AUTHENTICATION & REGISTRATION MODALS (Shipper & Partner)
  // ==========================================================================
  openAuthModal(mode = 'login', role = 'shipper') {
    const modal = document.getElementById('commonModalOverlay');
    const title = document.getElementById('commonModalTitle');
    const body = document.getElementById('commonModalBody');

    if (mode === 'login') {
      title.innerText = 'Sign In to ShipFlow';
      body.innerHTML = `
        <div style="display:flex; background:#f1f5f9; border-radius:8px; padding:3px; margin-bottom:14px;">
          <button class="btn btn-sm ${role === 'shipper' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; border:none;" onclick="app.openAuthModal('login', 'shipper')">Shipper</button>
          <button class="btn btn-sm ${role === 'partner' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; border:none;" onclick="app.openAuthModal('login', 'partner')">Delivery Partner</button>
          <button class="btn btn-sm ${role === 'admin' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; border:none;" onclick="app.openAuthModal('login', 'admin')">Admin</button>
        </div>

        <div class="form-group">
          <label class="form-label">Email or Mobile Number</label>
          <input type="text" class="form-input" id="authEmail" value="${role === 'shipper' ? 'alex@nexuslogistics.com' : role === 'partner' ? 'marcus.driver@shipflow.io' : 'admin@shipflow.com'}">
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="authPassword" placeholder="Enter password">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:0.75rem;">
          <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="checkbox" checked> Remember Device
          </label>
          <span style="color:#2563eb; font-weight:600; cursor:pointer;" onclick="app.openAuthModal('forgot')">Forgot Password?</span>
        </div>

        <button class="btn btn-primary btn-block" style="padding:12px; margin-bottom:8px;" onclick="app.submitLogin('${role}')">
          Sign In
        </button>

        <button class="btn btn-secondary btn-block" style="padding:12px; margin-bottom:14px;" onclick="app.openAuthModal('otp', '${role}')">
          🔑 Login with One-Time OTP
        </button>

        <div style="text-align:center; font-size:0.78rem; color:#64748b;">
          Don't have an account? 
          ${role === 'admin' ? '' : `<span style="color:#2563eb; font-weight:700; cursor:pointer;" onclick="app.openAuthModal('register', '${role}')">Register as ${role === 'shipper' ? 'Shipper' : 'Partner'}</span>`}
        </div>
      `;
    } else if (mode === 'register') {
      title.innerText = role === 'shipper' ? 'Shipper Registration' : 'Partner Driver Onboarding';
      body.innerHTML = `
        <div style="display:flex; background:#f1f5f9; border-radius:8px; padding:3px; margin-bottom:14px;">
          <button class="btn btn-sm ${role === 'shipper' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; border:none;" onclick="app.openAuthModal('register', 'shipper')">Shipper Account</button>
          <button class="btn btn-sm ${role === 'partner' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; border:none;" onclick="app.openAuthModal('register', 'partner')">Delivery Partner</button>
        </div>

        <div class="form-group">
          <label class="form-label">Full Legal Name *</label>
          <input type="text" class="form-input" id="regName" placeholder="e.g. Rachel Adams">
        </div>

        ${role === 'shipper' ? `
          <div class="form-group">
            <label class="form-label">Company / Trading Entity *</label>
            <input type="text" class="form-input" id="regCompany" placeholder="e.g. Apex Global Supply Chain LLC">
          </div>
        ` : `
          <div class="form-group">
            <label class="form-label">Vehicle Type & License Plate *</label>
            <input type="text" class="form-input" id="regVehicle" placeholder="e.g. Mercedes Sprinter (CA-7X912)">
          </div>
        `}

        <div class="form-group">
          <label class="form-label">Business Email Address *</label>
          <input type="email" class="form-input" id="regEmail" placeholder="name@company.com">
        </div>

        <div class="form-group">
          <label class="form-label">Mobile Phone (For Dispatch SMS) *</label>
          <input type="tel" class="form-input" id="regPhone" placeholder="+1 (555) 000-0000">
        </div>

        <div class="form-group">
          <label class="form-label">Create Password *</label>
          <input type="password" class="form-input" id="regPass" placeholder="At least 8 characters">
        </div>

        <button class="btn btn-success btn-block" style="padding:12px; margin-top:6px; margin-bottom:10px;" onclick="app.openAuthModal('otp', '${role}')">
          Continue to Phone Verification (OTP) →
        </button>

        <div style="text-align:center; font-size:0.78rem; color:#64748b;">
          Already registered? 
          <span style="color:#2563eb; font-weight:700; cursor:pointer;" onclick="app.openAuthModal('login', '${role}')">Sign In</span>
        </div>
      `;
    } else if (mode === 'otp') {
      title.innerText = 'Two-Factor OTP Verification';
      body.innerHTML = `
        <div style="text-align:center; margin-bottom:16px;">
          <div style="font-size:0.8rem; color:#64748b; line-height:1.4;">
            We sent a secure 6-digit confirmation code to your registered mobile number:
            <br><strong style="color:#0f172a;">+1 (415) •••• 2341</strong>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:8px; margin-bottom:16px;">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="8">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="4">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="9">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="2">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="0">
          <input type="text" maxlength="1" class="form-input" style="width:40px; text-align:center; font-size:1.2rem; font-weight:700;" value="1">
        </div>

        <div style="text-align:center; font-size:0.75rem; color:#64748b; margin-bottom:16px;">
          Code expires in <span style="color:#2563eb; font-weight:700;">00:48</span> • 
          <span style="color:#2563eb; font-weight:600; cursor:pointer;" onclick="app.showToast('New OTP dispatched: 849201', 'info')">Resend Code</span>
        </div>

        <button class="btn btn-primary btn-block" style="padding:12px; margin-bottom:8px;" onclick="app.verifyOTP('${role}')">
          Verify & Enter ShipFlow Portal
        </button>
      `;
    } else if (mode === 'forgot') {
      title.innerText = 'Reset Password';
      body.innerHTML = `
        <div style="font-size:0.8rem; color:#64748b; margin-bottom:14px;">
          Enter your registered email address or mobile number. We will send you an instantaneous recovery link.
        </div>

        <div class="form-group">
          <label class="form-label">Email or Phone</label>
          <input type="text" class="form-input" placeholder="alex@nexuslogistics.com">
        </div>

        <button class="btn btn-primary btn-block" style="padding:12px; margin-bottom:10px;" onclick="app.showToast('Password reset link dispatched via SMS & Email!', 'success'); app.closeModal();">
          Send Recovery Instructions
        </button>

        <div style="text-align:center; font-size:0.78rem;">
          <span style="color:#2563eb; font-weight:600; cursor:pointer;" onclick="app.openAuthModal('login')">← Back to Sign In</span>
        </div>
      `;
    }

    modal.classList.add('active');
  }

  async submitLogin(role) {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value || '';
    if (!email || !password || password.includes('••')) {
      this.showToast('Enter the account email and password. Demo passwords are shown below.', 'warning');
      return;
    }
    const result = await ShipFlowAPI.login(email, password, role);
    if (!result.success) { this.showToast(result.message || 'Login failed', 'error'); return; }
    this.state.currentUser = result.user;
    this.state.currentRole = result.user.role;
    this.persist();
    this.closeModal();
    this.setRole(result.user.role);
    await this.syncWithMongoDB();
    this.showToast(`Logged in successfully as ${result.user.role}!`, 'success');
  }

  async submitRegistration(role) {
    const name = document.getElementById('regName')?.value?.trim();
    const company = document.getElementById('regCompany')?.value?.trim();
    const vehicle = document.getElementById('regVehicle')?.value?.trim();
    const email = document.getElementById('regEmail')?.value?.trim();
    const phone = document.getElementById('regPhone')?.value?.trim();
    const password = document.getElementById('regPass')?.value || '';
    if (!name || !email || !phone || !password) { this.showToast('Please fill all required registration fields.', 'warning'); return; }
    const result = await ShipFlowAPI.register({ name, company, vehicle, email, phone, password, role });
    if (!result.success) { this.showToast(result.message || 'Registration failed', 'error'); return; }
    this.state.currentUser = result.user;
    this.state.currentRole = result.user.role;
    this.persist();
    this.closeModal();
    this.setRole(result.user.role);
    await this.syncWithMongoDB();
    this.showToast('Account created and signed in successfully.', 'success');
  }

  verifyOTP(role) {
    this.closeModal();
    this.setRole(role);
    this.showToast('OTP verified successfully! Session authenticated.', 'success');
  }

  closeModal() {
    const modal = document.getElementById('commonModalOverlay');
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3800);
  }

  getBadgeClass(status) {
    switch (status) {
      case 'In Transit': return 'badge-in-transit';
      case 'Out for Delivery': return 'badge-out-delivery';
      case 'Delivered': return 'badge-delivered';
      case 'Created': return 'badge-pending';
      case 'Confirmed': return 'badge-pending';
      case 'Assigned': return 'badge-out-delivery';
      case 'Picked Up': return 'badge-in-transit';
      case 'Pending': return 'badge-pending';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-in-transit';
    }
  }

  bindGlobalEvents() {
    // Backdrop click close modal
    const overlay = document.getElementById('commonModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }
  }
}

// Global initialization
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new ShipFlowApp();
});
