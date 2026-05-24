# Product Specification — Tenant Portal
## Sheinfeld Group | Real Estate Development | 50 Years of Excellence
**Version:** 1.1 (Final)
**Platform:** Lovable (React)
**Languages:** Hebrew (RTL primary) + English

---

## 1. Branding & Visual Identity

### Color Palette (from logo)
| Name | HEX | Usage |
|------|-----|-------|
| Navy | #4A5568 | Primary text, header, buttons |
| Gold | #B8956A | Accents, highlights, progress bars, hover |
| White | #FFFFFF | Primary background |
| Light Gray | #F7F8FA | Card backgrounds |
| Dark | #2D3748 | Heavy headings |

### Typography
- Headings: Noto Serif Hebrew — conveys luxury and trustworthiness
- Body: Heebo — readable, clean, modern
- English: Playfair Display (headings) + Inter (body)

### Logo
- File: sheinfeld-logo-transparent.png
- Display: Header + login screen

---

## 2. Project Overview

A dedicated tenant portal integrated into the Sheinfeld Group corporate website, designed for tenants who have signed a Pinuy-Binuy (evacuation-reconstruction) or Tama 38 agreement. The portal provides full transparency, peace of mind, and up-to-date information throughout the entire project lifecycle — from signing to key handover.

### Target Audience
- Tenants who have signed an agreement (Pinuy-Binuy / Tama 38)
- Average age: 45-70
- Property value: 3-4 million ILS+
- Tech level: Medium — expect a simple, clear, reassuring interface
- High sensitivity to credibility, transparency, and sense of security

### Core Design Principles
- Premium & Trust — luxury aesthetic that instills confidence
- Clarity First — clear information, strong hierarchy, no clutter
- Warm Authority — warm but professional, like a good private bank

---

## 3. System Architecture

```
Sheinfeld Group Website (Lovable)
├── Home
├── Projects
├── About
├── Contact
└── Tenant Login → Tenant Portal (authenticated)
    ├── Main Dashboard
    ├── Project Status
    ├── My Apartment
    ├── Documents
    ├── Project Team
    └── Chat / Inquiries

/admin → Admin Panel (admin users only)
```

---

## 4. Authentication & Permissions

### Tenant Login
- Username + Password (no OTP, no Google SSO)
- Account created by secretary only
- Tenant receives automatic welcome email with login credentials
- "Forgot password" → reset via email
- Tenants who have NOT signed: no access, no self-registration

### Permission Levels
| Role | Access |
|------|--------|
| Tenant | View: project status, their apartment, their documents, chat |
| Admin / Secretary | Full management — all projects, all tenants |
| Senior Manager | Same as admin |

---

## 5. Tenant Portal — Screens

### 5.1 Login Screen
- Prominent Sheinfeld logo
- Fields: Username + Password
- Login button in Gold color
- Forgot password link
- Footer text: "Access is restricted to signed tenants only"
- Background: blurred project image or architectural texture

---

### 5.2 Main Dashboard

Top section:
- "Welcome, [Name] — [Project Name]"
- Current stage: "Project is currently at: Building Permit Application"

Quick stat cards (4 cards):
1. Signature Progress — circular progress bar + percentage
2. Days to Handover — bold countdown
3. Documents — number of docs in your file
4. Messages — badge if new chat message

Navigation shortcuts to all sections

---

### 5.3 Project Status

#### Signature Progress
- Horizontal progress bar + percentage + "X out of Y apartment owners have signed"
- Manual update by admin

#### Timeline
| Icon | Stage | Date | Status |
|------|-------|------|--------|
| Done | Signature Collection | Mar 2024 | Completed |
| Done | Appointment of Professionals | Jun 2024 | Completed |
| Active | Building Permit Application | Jan 2025 | In Progress |
| Pending | Permit Approval | Aug 2025 | Upcoming |
| Pending | Construction Start | Jan 2026 | Upcoming |
| Pending | Key Handover | Dec 2027 | Upcoming |

- Each stage: editable date + optional admin note
- All updates manual by admin

#### Expected Handover
- Bold prominent date
- Admin can add a note (e.g. "Updated due to security situation")

---

### 5.4 My Apartment

#### Property Details
| Field | Display |
|-------|---------|
| Address | Full address |
| Floor | Floor number |
| Current Area | X sqm |
| New Area (Pinuy-Binuy) | X sqm |
| Addition | +X sqm |
| New Floor | Floor X |
| Property Appreciation | +X% / +X ILS |

Note: Market value is NOT displayed. Pinuy-Binuy only shows appreciation.

#### Technical Specs — Visual Layers

Layer 1 — Feature Icons (always visible):
Elevator, Parking, Storage Room, Safe Room (Mamad), Garden, Gym, Pool, Bike Room — checkmark or X per feature

Layer 2 — Spec Tabs (on click):
- Finishes (flooring, cladding, doors, windows)
- Kitchen & Sanitation
- Electrical & Technology (smart home, intercom)
- Plumbing
- Exterior (lobby, parking, garden)

Each tab: title + short description + reference image (optional)

Layer 3 — Gallery:
Renders and project photos: building facade, lobby, sample apartment, garden, view

---

### 5.5 Documents

#### Categories (Phase 1)
| Category | Documents |
|----------|-----------|
| Contracts | Pinuy-Binuy / Tama 38 agreement, appendices |
| Guarantees | Bank guarantee, performance guarantee |
| Deposits & Collateral | Deposit confirmations |
| Power of Attorney | Notarized power of attorney |
| Official Approvals | Building permit, municipal approval |
| Blueprints | Apartment plan, floor plan |

Additional categories can be added via admin panel.

#### Actions
- Tenant: View + Download only (inline PDF viewer)
- Admin: Upload / edit / delete per tenant + category
- Each file: name + upload date + file size

---

### 5.6 Project Team

Card layout per professional:
- Round photo (gray placeholder if none)
- Full name
- Role
- Company / Firm
- No direct phone number — all communication via chat only

Possible roles: Developer, General Contractor, Architect, Structural Engineer, Tenant Attorney, Appraiser, Financing Bank, Site Manager, Supervisor

---

### 5.7 Chat & Inquiries

Active Hours: 09:00-15:00 (displayed clearly to tenant)

During active hours:
- Real-time chat with secretary (Supabase Realtime)
- Full chat history
- Read / Unread indicators

Outside active hours:
- FAQ Bot answers common questions:
  - What is the current project stage?
  - When is the expected handover?
  - Where can I find my contract?
  - Who is the architect / contractor?
  - What is the current signature percentage?
  - How do I reset my password?
- If bot cannot answer: "Your inquiry has been received. We will get back to you during active hours (09:00-15:00)"

Notifications:
- No push / SMS / email notifications
- Visual badge inside portal only (on chat icon)
- Tenant logs in and sees updates — no flooding

---

## 6. Admin Panel

### Access
- Route: /admin — separate login
- All admin users have full access (no role separation)
- Ability to add/remove admin users

### Project Management (multiple simultaneous projects)
- Dashboard showing all active projects
- Select project to manage it

### Tenant Management
- Create account: name + email + phone + project + apartment
- Automatic welcome email
- Password reset
- Suspend / delete account

### Project Content Management
- Update signature percentage
- Update timeline stages, dates, and notes
- Update handover date and note
- Update professional team members
- Update technical specs and gallery images

### Document Management
- Upload per tenant + category
- Edit / delete documents

### Chat Management
- View all conversations by project or tenant
- Reply to tenants
- Mark conversation as handled
- Set active hours (09:00-15:00)

---

## 7. Technical Stack

| Topic | Solution |
|-------|----------|
| Platform | Lovable (React) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Real-time Chat | Supabase Realtime |
| FAQ Bot | React logic + Supabase Edge Functions |
| Internationalization | i18n — Hebrew RTL default + English |
| Responsiveness | Mobile + Desktop |

### Core DB Schema
```
projects       — real estate projects
apartments     — units linked to project
users          — tenants and admins
documents      — files linked to tenant and category
project_team   — professionals linked to project
timeline_steps — stages linked to project
amenities      — building features linked to project
chat_messages  — chat messages
```

---

## 8. Development Phases

### Phase 1 — MVP
- [ ] Login screen + authentication
- [ ] Main dashboard
- [ ] Project status (signatures + timeline)
- [ ] My Apartment (details + visual specs)
- [ ] Documents (view + download)
- [ ] Project team
- [ ] Basic admin panel

### Phase 2
- [ ] Real-time chat + FAQ bot
- [ ] Renders gallery
- [ ] English language (i18n)
- [ ] Multi-project admin view

### Phase 3
- [ ] Animated countdown
- [ ] PWA mobile experience
- [ ] Updates board

---

## 9. Lovable Prompt

Build a premium tenant portal for "Sheinfeld Group — Real Estate Development", a 50-year-old Israeli real estate company specializing in Pinuy-Binuy (evacuation-reconstruction) projects.

BRANDING:
- Colors: Navy #4A5568 (primary), Gold #B8956A (accent), White #FFFFFF (background), Light Gray #F7F8FA (cards)
- Fonts: Noto Serif Hebrew (headings), Heebo (body)
- Logo file: sheinfeld-logo-transparent.png — in header and login screen
- Direction: RTL (Hebrew primary), with English i18n toggle

AUTHENTICATION (Supabase Auth):
- Username + password only
- No self-registration — admin creates accounts
- Forgot password via email reset
- Two roles: tenant (read-only) and admin (full management)

DATABASE (Supabase PostgreSQL):
Tables: projects, apartments, users, documents, project_team, timeline_steps, amenities, chat_messages

TENANT PORTAL SCREENS:

1. Login — logo, username + password, forgot password link, architectural background

2. Dashboard — personalized greeting, 4 stat cards (signature %, days to handover, document count, unread badge), navigation shortcuts

3. Project Status — signature progress bar with count, visual timeline (completed/in-progress/upcoming), prominent handover date with admin note option

4. My Apartment — property details table (address, floor, sqm, new sqm, appreciation for Pinuy-Binuy only — no market value shown), amenities icon grid (elevator, parking, storage, safe room, garden, gym, pool), tabbed specs (finishes / kitchen / electrical / plumbing / exterior), photo gallery

5. Documents — categorized file list (Contracts, Guarantees, Deposits, Power of Attorney, Approvals, Blueprints), inline PDF viewer, download button, upload date shown — tenant view only, no upload

6. Project Team — professional cards with round photo (placeholder if none), name, role, company — no phone numbers

7. Chat — Supabase Realtime active 09:00-15:00, full history, read/unread, FAQ bot outside hours with fallback message, badge notification only

ADMIN PANEL (/admin):
- Separate login
- Multi-project dashboard
- Tenant management: create, welcome email, reset password, suspend/delete
- Content management: signature %, timeline, handover date, team, specs, gallery
- Document management: upload/edit/delete per tenant and category
- Chat management: reply, mark handled, set active hours

DESIGN:
- Premium luxury real estate — warm, trustworthy, not sterile
- Full RTL for Hebrew, LTR for English
- Fully responsive: desktop + mobile
- Smooth transitions and micro-animations
- Distinctive refined aesthetic — not generic
