# Bahi-Khata Modern (बही-खाता मॉडर्न)

> **Family Shop Expense, Staff Payroll & Cash Drawer (Galla) Ledger Web App**

A modern, production-grade, local-first web application designed for family-run retail stores, kirana shops, and commercial establishments in India. Blends classic editorial heritage ledger aesthetics with modern SaaS UX.

![Bahi-Khata Modern](https://img.shields.io/badge/Made%20with-React%20%2B%20TypeScript-blue)
![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-teal)
![Visualization](https://img.shields.io/badge/Charts-Recharts-orange)
![Currency](https://img.shields.io/badge/Currency-INR%20(%E2%82%B9)%20Lakhs%20%26%20Crores-emerald)

---

## 🌟 Key Features

### 1. Interactive First-Time Setup Wizard
- **Step 1:** Shop Profile & Opening Balances (*Cash in Galla ₹* and *Bank/UPI ₹*) with a 1-click **"Skip & Load Sample Demo Data"** option (preloaded with 29 realistic Indian shop records).
- **Step 2:** Family Members setup with monthly drawing limits/budgets.
- **Step 3:** Shop Employees directory with roles, base salaries, and salary cycle days.
- **Step 4:** Consolidated summary card & launch sequence.

### 2. Automatic Balance Deduction Engine
- **Live Galla & Bank Balance:**
  - Cash expenses automatically deduct from the physical cash drawer (*Galla*).
  - UPI/Bank transfer/Cheque expenses automatically deduct from Bank balance.
  - "+ Add Cash / Daily Sales Top-up" to record customer sales into Galla or Bank.
- **Family Member Ledger:**
  - Case A: Personal withdrawals auto-deduct from the family member's monthly limit and shop drawer.
  - Case B: Personal money paid for shop supplies tracks an accounts-payable liability (`Shop Owes: ₹X`) with 1-click settlement.
- **Staff Payroll & Advance (*Upaad*) Management:**
  - Mid-month advances (*Upaad*), food allowances, or leave penalties automatically deduct from net payable salary.
  - Visual progress bar: Base Salary | Taken | Net Remaining.
  - Warning alert if employee advances exceed base monthly salary.
  - **1-Click Salary Settlement:** Calculates `Net Payable = Base + Bonus − (Advance + Deduction)` and logs the payout entry directly into the main Expense Ledger under `staff_payroll`.
  - Chronological individual staff passbook statement with running balances.

### 3. Executive Command Center
- **Bento KPI Grid:** Total Monthly Outflow (% vs last month), Cash Drawer vs. Digital (UPI/Bank) split, Staff Payroll liability, and Pending vendor credit dues.
- **Interactive Recharts Suite:**
  - 30-day Expense Trend Area composed chart (7D / 30D toggles).
  - Category Breakdown Donut chart with custom legends.
  - Payment Mode distribution bar chart.
  - Staff Cost-to-Operation ratio gauge.
- **Recent Activity Feed & Upcoming Dues Reminders.**

### 4. Smart Expense Ledger
- Indian retail categories: Inventory/Stock, Staff Payroll, Staff Welfare (*Chai/Samosa*), Utilities, Logistics (*Hamali*), Petty Cash, Maintenance, Marketing, Vendor Settlements.
- **Pakka Bill (GST Invoice with GSTIN amount) vs. Kaccha Slip** classification.
- Dynamic summary ribbon recalculating filtered totals.
- Filters by Date Range (Today, Week, Month, Custom), Category, Mode, Bill Type, and Payment Status.

### 5. Vendor & Recurring Obligations Tracker
- Tracks recurring fixed overhead: Shop Rent, Electricity (DISCOM), Broadband (Jio Fiber), Security Guard, CA Retainer, Chai Vendor.
- Status badges: Paid, Due Soon, Overdue, Upcoming with cycle days.
- **"Mark as Paid"** records the ledger expense and automatically deducts the designated balance.

### 6. Reports, Print-Ready CA Ledger & Backup
- **Print-Optimized Monthly Statement:** `@media print` optimized layout for Chartered Accountants with signature lines and tabular audit sheets.
- **CSV Data Exports:** One-click export for expenses and staff passbooks.
- **Full JSON Backup & Restore:** Complete state snapshot export and upload capability.
- **Theme Support:** Modern Heritage light theme and Deep Obsidian dark mode.

---

## ⌨️ Shop-Floor Keyboard Shortcuts

You can use these keys anywhere in the application (when not inside a text input):
- `N` — Open **New Expense** Drawer / Modal
- `D` — Switch to **Executive Dashboard**
- `E` — Switch to **Expense Ledger**
- `S` — Switch to **Staff & Payroll**
- `F` — Switch to **Family Members**
- `R` — Switch to **Recurring Bills**
- `B` — Switch to **Reports & CA Backup**
- `Esc` — Close any open modal or side drawer

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS (Custom Heritage & Obsidian tokens)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Currency/Numbers:** Native `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`
- **Persistence:** LocalStorage with JSON Export/Import & CSV support

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/prashantb2400/Expense-Tracker.git
cd Expense-Tracker

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
MIT License. Built for family-run retail businesses across India.
