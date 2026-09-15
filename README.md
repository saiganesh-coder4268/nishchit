# NISHCHIT 🚌 — Certainty for Every Parent
### Unified Transport Operating System + Driver Marketplace + Real-Time Fleet Radar

> **"Know when the bus starts. Know where it is."**  
> *Zero student phone dependency. Zero calling while driving. Complete operational certainty.*

[![Live App on Vercel](https://img.shields.io/badge/Vercel-Deployed%20Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nishchit-app.vercel.app)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20RTDB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://console.firebase.google.com/project/nishchit-eb118/overview)
[![Vite](https://img.shields.io/badge/Vite-Production%20Ready-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Live%20Telemetry-4285F4?style=for-the-badge&logo=google-maps&logoColor=white)](https://developers.google.com/maps)

---

## 🌐 Live Production Deployment

- 🚀 **Live Web App**: [https://nishchit-app.vercel.app](https://nishchit-app.vercel.app)
- 🏫 **Institution Operations Desk**: [https://nishchit-app.vercel.app/institution/login](https://nishchit-app.vercel.app/institution/login)
- 👨‍✈️ **Driver Cockpit & Marketplace**: [https://nishchit-app.vercel.app/driver/login](https://nishchit-app.vercel.app/driver/login)
- 👨‍👩‍👧 **Parent Live Radar**: [https://nishchit-app.vercel.app/parent/login](https://nishchit-app.vercel.app/parent/login)
- 🛡️ **Platform Administrator**: [https://nishchit-app.vercel.app/platform-admin/login](https://nishchit-app.vercel.app/platform-admin/login)
- 💻 **GitHub Repository**: [https://github.com/saiganesh-coder4268/nishchit](https://github.com/saiganesh-coder4268/nishchit)

---

## 📌 Problem Statement

Every morning and evening across India's school and college transportation networks:
1. **Parent Anxiety**: Parents repeatedly call drivers while buses are in motion, risking road accidents.
2. **Student Phone Restrictions**: School students and intermediate college pupils do not and should not carry smartphones.
3. **Institutional Blindspots**: Schools and colleges struggle with driver shortages, unverified commercial licenses, and manual attendance coordination.
4. **Driver Disconnect**: Qualified heavy-passenger drivers lack an institutional hiring marketplace and a dedicated, distraction-free duty cockpit.

---

## 💡 The Nishchit Solution

Nishchit delivers an end-to-end transport operating ecosystem with strict architectural role separation:

```
                                  ┌───────────────────────────────┐
                                  │   PLATFORM OPERATOR CONSOLE   │
                                  │  (Verify Drivers/Institutions)│
                                  └───────────────┬───────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │ INSTITUTION COMMAND DESK  │ ◄────── [DRIVER MARKETPLACE] ─────► │  DRIVER OPERATING COCKPIT │
   │ (Fleet, Routes, Incidents)│                                     │(Start Trip, GPS Telemetry)│
   └─────────────┬─────────────┘                                     └─────────────┬─────────────┘
                 │                                                                 │
                 ▼                                                                 ▼
   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
   │                            DUAL-TIER FIREBASE DATA LAYER                                    │
   │  • Cloud Firestore: Fleet Buses, Verified Profiles, Job Pipeline, Route Corridors, Reports  │
   │  • Realtime Database (RTDB): High-Frequency Hardware GPS Stream (~3s), Live Speed & Bearing │
   └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                  │
                                                  ▼
                                   ┌─────────────────────────────┐
                                   │      PARENT LIVE RADAR      │
                                   │ (Real-Time ETA, Next Stop,  │
                                   │   Live Corridor Map Radar)  │
                                   └─────────────────────────────┘
```

---

## 🏛️ Comprehensive Role Architecture

| Portal | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Institution Transport Desk** | `/institution/dashboard` | Fleet vehicle manager, Corridor route builder, Incident reporting center, KPI telemetry bar (Buses, Live Now, Roster, Students, Open Positions), **Driver Marketplace** (Create jobs, invite drivers, review applications). |
| **Driver Cockpit & Marketplace** | `/driver/dashboard` | Verification badge (`🟢 Platform Verified Driver`), assigned bus duty (`Bus 12`), touch-friendly `START TRIP` / `END TRIP`, real-time hardware GPS streaming, predefined safety broadcast buttons, job discovery board, and professional profile. |
| **Parent Live Transit Radar** | `/parent/dashboard` | Clean, low-cognitive-load live bus tracking, real-time ETA countdown, next stop indicator, ordered corridor stop checklist, and driver message feed. |
| **Platform Operator** | `/platform-admin/dashboard` | Ecosystem moderation, driving license & police verification approvals, educational institution verification, and corridor health telemetry. |

---

## 📱 Mobile-First Engineering & Responsiveness

Nishchit is engineered with high-density mobile viewports in mind:
- **Responsive Flexbox Header**: School identity, verification badge, active bus counter, and quick-action buttons wrap cleanly on phone screens ($\le 640\text{px}$).
- **Swipeable Horizontal Tabs**: Navigation tabs scroll with smooth native momentum and hidden scrollbars.
- **Adaptive KPI Metrics Grid**: Dynamic 3-column / 2-column mobile cards preventing text truncation or overflow.
- **Native Bottom-Sheet Modals**: Dialogs like *"Add Bus to Fleet"* and *"Log Incident"* adapt to bottom sheets on mobile devices with $\ge 44\text{px}$ touch targets and $16\text{px}$ inputs to eliminate mobile browser auto-zoom.
- **Global Viewport Safety**: Strict `overflow-x: hidden` eliminating horizontal screen wobbling.

---

## 🔑 One-Tap Instant Demo Profiles

No typing required — instant demo logins are available on every login portal:

### 1. 🏫 Institution Transport Desk
- **Portal**: `/institution/login`
- **Demo Option**: Click **"Enter Demo Desk: Andhra University"**
- **Features**: Scoped by Institution (`INST-AU`). Manage fleet (`BUS-AU01`, `BUS-AU02`), inspect Siripuram & AU corridors, post driver openings, review applicants, log incidents.

### 2. 🚌 Driver Cockpit & Real Hardware GPS
- **Portal**: `/driver/login`
- **Demo Option**: Click **"One-Tap Driver Cockpit: Suresh Reddy"**
- **Features**: Approved driver assigned to **`BUS-AU01`** on Route `ROUTE-AU01`. Requires platform assignment to unlock trip initiation. Prompts real hardware GPS (`navigator.geolocation`) on **`START TRIP`** — zero fake coordinates — and streams live telemetry to Firebase RTDB.

### 3. 👨‍👩‍👧 Parent Live Radar & 2-Device Demonstration
- **Portal**: `/parent/login`
- **Demo Option**: Click **"Track Live Bus: Anita Rao (AU Student Parent)"**
- **Features**: Real-time live tracking of `BUS-AU01`. Real two-device demonstration mode: switch between **`Registered Stop`** and **`📍 Use My Current Location`** (ephemeral in-memory). Google Maps `DirectionsService` computes authentic road routing, live road distance remaining, and estimated travel time.

### 4. 🛡️ Platform Operator
- **Portal**: `/platform-admin/login`
- **Demo Option**: Click **"Platform Operator Login"**
- **Features**: Multi-institution verification (`INST-AU`, `INST-GITAM`, `INST-MVGR`), driver commercial heavy-license review, and ecosystem moderation.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, Vite, React Router v7, Lucide Icons (`lucide-react`)
- **Maps & GIS**: Google Maps JavaScript API (`@react-google-maps/api`), Leaflet / React Leaflet fallback
- **Data & Telemetry**:
  - **Cloud Firestore**: Authoritative persistent records, fleet registry, driver applications, routes, incidents.
  - **Firebase Realtime Database**: Low-latency GPS coordinate stream (`liveLocations/`, `busLocations/`), safety broadcasts (`messages/`).
- **Styling**: Vanilla CSS Design System with responsive tokens, glassmorphism, and mobile media queries.
- **Hosting & CI/CD**: Vercel Git-integrated automatic deployment pipeline.

---

## 🚀 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/saiganesh-coder4268/nishchit.git
cd nishchit

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional, production fallbacks included)
cp .env.example .env

# 4. Start the local development server
npm run dev

# 5. Build and validate production bundle
npm run build
```

---

## 🛡️ Firebase Security Rules

Security rules are configured and deployed to Firebase project `nishchit-eb118`:
- `firestore.rules`: Enables verified read/write access across `buses`, `routes`, `trips`, `tripHistory`, `reports`, `driverProfiles`, and `jobPostings`.
- `database.rules.json`: Provides open read/write streaming for live GPS coordinates (`liveLocations/`, `busLocations/`) and route broadcasts (`messages/`).

Deploy rules anytime via Firebase CLI:
```bash
npx firebase deploy --only firestore:rules,database
```

---

## 📄 License & Attribution

Built for the **Educational Corridor Transport Initiative** across Andhra Pradesh (Vijayawada – Visakhapatnam corridor).  
Developed with precision by **Saiganesh Palos** & the Nishchit engineering team.
