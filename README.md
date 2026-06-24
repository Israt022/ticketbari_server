<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=700&size=35&pause=1000&color=8B5CF6&center=true&vCenter=true&width=900&lines=🚍+TicketBari+Server;REST+API+for+Ticket+Booking+Platform;Secure+JWT+Authentication;Stripe+Payment+Integration" />
</p>

# 🚀 TicketBari Server

Backend API for the TicketBari transport ticket booking platform. The server handles authentication, authorization, ticket management, booking requests, Stripe payments, revenue analytics, and dashboard functionalities for Users, Vendors, and Admins.

---

## 🌐 Live API

Backend URL:

```text
https://ticketbari-server-two.vercel.app/
```

---

# ✨ Core Features

## 🔐 Authentication & Authorization

* JWT Authentication
* Protected APIs
* Role Based Access Control
* User Roles:

  * User
  * Vendor
  * Admin

---

## 🎫 Ticket Management

### Vendor Features

* Add Tickets
* Update Tickets
* Delete Tickets
* Manage Own Tickets
* View Ticket Statistics

### Admin Features

* Approve Tickets
* Reject Tickets
* Manage Advertisements
* Monitor Platform Activities

---

## 📦 Booking Management

### User

* Create Booking Requests
* View Booking History
* Track Booking Status

### Vendor

* View Booking Requests
* Accept Requests
* Reject Requests

---

## 💳 Stripe Payment Integration

Secure payment processing using Stripe.

### Features

* Stripe Checkout Session
* Payment Verification
* Booking Status Update
* Transaction Tracking
* Revenue Calculation

---

## 📊 Revenue Analytics

Vendor Revenue Dashboard includes:

* Total Tickets Added
* Total Tickets Sold
* Total Revenue
* Revenue Overview API

---

## 👨‍💼 Admin Dashboard APIs

* Manage Users
* Manage Tickets
* Manage Advertisements
* Platform Monitoring

---

# 🛠️ Technologies Used

## Backend

* Node.js
* Express.js
* MongoDB
* JWT
* Stripe

## Database

* MongoDB Atlas

## Security

* JWT Authentication
* Role Based Authorization
* Protected Routes
* CORS Configuration

---

# 📡 API Endpoints

## Authentication

```http
POST /jwt
```

---

## Tickets

```http
GET    /tickets
GET    /tickets/:id
POST   /tickets
PATCH  /tickets/:id
DELETE /tickets/:id
```

---

## Bookings

```http
GET    /user/bookings
POST   /bookings
PATCH  /bookings/:id
PATCH  /bookings/payment-success/:id
```

---

## Vendors

```http
GET /vendor/tickets
GET /vendor/booking-requests
GET /vendor/revenue-overview
```

---

## Admin

```http
GET    /users
PATCH  /users/:id
GET    /advertisements
PATCH  /advertisements/:id
```

---

# 👨‍💻 Developer

### Israt Jahan

Full Stack Developer

Built with ❤️ using Node.js, Express, MongoDB, JWT & Stripe.
