# NISHCHIT 🚌
### Live School & College Bus Tracking + Driver–Parent Communication

> **"Know when the bus starts. Know where it is."**  
> *No student phone. No phone call. No guessing.*

Nishchit is a responsive web application that creates a direct real-time certainty layer between school/college bus drivers and parents without requiring students to carry personal phones.

---

## 📌 Problem Statement

In many school and junior-college transport systems across India, parents face constant uncertainty:
- Has the bus actually started from school?
- Is the bus delayed in traffic or stopped?
- Where is the bus right now?

Calling the driver while driving is dangerous and unreliable, and most school/intermediate students do not carry personal smartphones.

---

## 💡 Solution

Nishchit establishes a direct, real-time tracking pipeline:

$$\text{DRIVER DEVICE (GPS / Demo Route)} \longrightarrow \text{FIREBASE REALTIME DB} \longrightarrow \text{GOOGLE MAPS LIVE MAP (Parent View)}$$

1. **Driver Starts Trip**: One-tap activation requests location or initiates simulated route movement.
2. **Realtime Synchronization**: Bus coordinates and trip status stream live via Firebase Realtime Database.
3. **Parent Visibility**: Linked parents see live status, relative update timestamps, and animated bus movement on a Google Maps interface.
4. **Safety-First Communication**: Drivers can send one-tap predefined quick status updates ("Traffic Delay", "Running Late") without typing while driving.

---

## ✨ Features

- 🔒 **Driver Authentication & Verification Badge**: Only verified driver accounts (`VERIFIED ✓`) can start a trip.
- ⚡ **One-Tap Trip Activation**: Single button tap toggles bus status to `🟢 BUS IS LIVE`.
- 📍 **Browser GPS & Realtime Google Maps**: Smoothly updates bus position on Google Maps JavaScript API with custom animated bus markers and InfoWindows.
- 💬 **Driver-Parent Communication**: Realtime message feed with safe quick-status buttons for drivers.
- 🛠️ **GPS Demo Mode**: Simulated urban Hyderabad route generator for indoor evaluation.
- ⚠️ **Offline & Connection Detection**: Displays last known location timestamp when connection drops.
- 📝 **Parent Issue Reporting**: Quick modal for reporting delays, non-movement, or emergency concerns.
- 🤖 **Nishchit Transport Assistant**: Natural-language query widget powered by transport state data.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), JavaScript, CSS3 Design System, React Router (`react-router-dom`), Lucide Icons (`lucide-react`)
- **Maps**: Google Maps JavaScript API (`@react-google-maps/api`)
- **Backend & Database**: Firebase Authentication, Firebase Realtime Database
- **Location**: Browser Geolocation API (`navigator.geolocation.watchPosition`)
- **Security**: Firebase Database Security Rules (`database.rules.json`)

---

## 🏗️ High-Level Architecture

```
                               ┌───────────────────────────────────┐
                               │       DRIVER DASHBOARD            │
                               │   (Start Bus / Geolocation /      │
                               │     Quick Status Broadcast)       │
                               └─────────────────┬─────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE REALTIME DATABASE                             │
│  buses/BUS24 ────────► status, latitude, longitude, accuracy, lastUpdated       │
│  messages/BUS24 ──────► sender, message, timestamp                              │
│  reports/ ────────────► parentId, type, description                             │
└────────────────────────────────────────────────┬────────────────────────────────┘
                                                 │
                                                 ▼
                               ┌───────────────────────────────────┐
                               │        PARENT DASHBOARD           │
                               │   (Google Maps Live Map, Realtime │
                               │    Listener, Driver Communication)│
                               └───────────────────────────────────┘
```

---

## 🔑 Demo Accounts & Instant Access

Nishchit provides **Instant Demo Access** buttons on the landing page and login screens:

### 🚌 Driver Account
- **Email**: `driver@nishchit.app`
- **Password**: `driver123`
- **Driver**: Rajesh Kumar (`DRV001`)
- **Bus / Route**: Bus 24 (`BUS24`) / Route 04 (`ROUTE04`)
- **Status**: `VERIFIED ✓`

### 👨‍👩‍👧 Parent Account
- **Email**: `parent@nishchit.app`
- **Password**: `parent123`
- **Student**: Aarav (Class 8-A)
- **Assigned Bus**: Bus 24 (`BUS24`)

---

## 🚀 Quick Setup & Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/saiganesh-coder4268/nishchit.git
   cd nishchit
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *The default Firebase configuration and Google Maps API Key are configured in `.env`.*

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🎬 End-to-End Demo Flow

To demonstrate Nishchit live during pitch or evaluation:

1. Open two browser windows or devices side-by-side.
2. In Window 1: Log in as **Driver** (`driver@nishchit.app` / `driver123`) or click **Instant Driver Demo**.
3. In Window 2: Log in as **Parent** (`parent@nishchit.app` / `parent123`) or click **Instant Parent Demo**.
4. In Window 1 (Driver): Tap **START BUS**. The status updates to `🟢 LIVE`.
5. In Window 2 (Parent): Observe status immediately switch to `🟢 LIVE`, relative update timestamp start ticking, and Google Maps marker pan smooth live position.
6. In Window 1 (Driver): Tap **Traffic delay** quick announcement.
7. In Window 2 (Parent): Open communication drawer or observe real-time message arrival.
8. In Window 1 (Driver): Tap **END TRIP**.
9. In Window 2 (Parent): Observe status transition to `TRIP COMPLETED`.

---

## 🛡️ Security & Verification Rules

- **Role-Based Access Control**: Drivers cannot access parent dashboards; parents cannot trigger driver start/end controls.
- **Verification Status**: Only drivers with `verificationStatus === 'VERIFIED'` can activate a trip. Drivers cannot alter their own verification status.
- **Firebase RTDB Rules (`database.rules.json`)**: Enforces authenticated role-based write limits for `buses/$busId` and `messages/$busId` nodes.

---

## ⚠️ Known Limitations & Design Decisions

- **Demo Route Coordinates**: Simulated demo movement relies on a predefined 6-point urban route loop for indoor/classroom demonstrations when physical GPS is unavailable.
- **No Student Device**: Nishchit intentionally operates without student smartphone dependencies or student tracking tags.

