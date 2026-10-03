# ShipFlow – College Logistics & Supply Chain Project

ShipFlow is a college-project logistics platform with a vanilla HTML/CSS/JS frontend and an Express + Mongoose + MongoDB backend.

## What was completed

- MongoDB persistence for shipments, users, partners, notifications, support tickets, addresses, pricing and invoices
- Credential-based login and registration with signed demo sessions
- Role-aware accounts: shipper, delivery partner and admin
- Shipment creation, status updates, driver assignment and Proof of Delivery
- Automatic invoice creation when a shipment is booked
- Invoice listing/status API
- Address CRUD API
- Driver/partner management API
- Existing simulated GPS, OTP, chat, calling and payment UI retained for college demonstration
- LocalStorage fallback retained if MongoDB/server is unavailable
- Express serves the frontend, so the complete demo can run from one URL

## Requirements

- Node.js 18+ (20+ recommended)
- MongoDB Community Server running locally OR MongoDB Atlas

## 1. Start MongoDB

For a local MongoDB installation, start the MongoDB service/application. MongoDB Compass is a GUI client; it does not itself replace the MongoDB server.

Default connection used by this project:

```text
mongodb://localhost:27017/shipflow
```

## 2. Configure backend

Open `server/.env` and set:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shipflow
CLIENT_ORIGIN=*
JWT_SECRET=shipflow-college-demo-secret-2026
```

For Atlas, replace `MONGODB_URI` with the Atlas connection string.

## 3. Install dependencies

From the `server` folder:

```bash
npm install
```

## 4. Start ShipFlow

```bash
npm start
```

Then open:

```text
http://localhost:5000
```

The backend API is under:

```text
http://localhost:5000/api/
```

## 5. MongoDB Compass

Open MongoDB Compass and connect to:

```text
mongodb://localhost:27017
```

You should see the database:

```text
shipflow
```

Collections will be created automatically after the server starts/seeds data. Expected collections include:

- users
- partners
- shipments
- invoices
- notifications
- supporttickets
- pricingrules
- addresses

To reset the college demo data, use the API endpoint:

```text
POST http://localhost:5000/api/seed
```

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Shipper | alex@nexuslogistics.com | shipper123 |
| Delivery Partner | marcus.driver@shipflow.io | driver123 |
| Admin | admin@shipflow.com | admin123 |

Use the Login modal in the app.

## Important college-demo limitation

GPS tracking, OTP, payments, chat and calling remain simulated/demo features. They are intentionally not connected to external services. The database, authentication, shipment workflow, driver assignment, POD and invoice flows are backed by MongoDB.


## College Project Upgrades

### Shipment lifecycle
ShipFlow now models the complete dispatch lifecycle:
`Created → Confirmed → Assigned → Picked Up → In Transit → Out for Delivery → Delivered`.
Status updates are validated on the backend and the tracking timeline is stored in MongoDB.

### Driver assignment
Admin users can assign or change a delivery partner from the Dispatch Board. Assignment updates the shipment status to `Assigned`, records the driver in MongoDB, and marks the partner as `Busy`.

### Admin analytics
The Admin Operations screen now calculates live metrics from the loaded MongoDB shipment/driver data, including total shipments, in-transit shipments, delivered shipments, pending shipments, active drivers, revenue, lifecycle distribution, recent shipments, and fleet status.

### Demo note
GPS movement, calling, chat, OTP, and payment remain simulated for the college demonstration. The database, authentication, shipment lifecycle, driver assignment, invoices, notifications, addresses, and support tickets are persisted through the Express/Mongoose backend.
