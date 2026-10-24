// ============================================================
// Bahi-Khata Modern — Executive Dashboard
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Smartphone,
  Users,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  CreditCard,
  Wallet,
  X,
  Plus,
  Clock,
  Filter,
  IndianRupee,
  Building2,
  QrCode,
  FileText,
  Landmark,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type {
  Expense,
  ExpenseCategory,
  PaymentMode,
  RecurringBill,
} from '../../types';
import { CATEGORY_LABELS, PAYMENT_MODE_LABELS } from '../../types';
import {
  formatINR,
  formatDate,
  getPercentageChange,
  isThisMonth,
  isLastMonth,
  isThisWeek,
  getDaysUntil,
  getCurrentMonth,
  CATEGORY_COLORS,
} from '../../utils/formatters';

// ---- Helpers ----

const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const PAYMENT_MODE_ICONS: Record<PaymentMode, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />,
  upi: <QrCode className="w-3.5 h-3.5" />,
  bank_transfer: <Landmark className="w-3.5 h-3.5" />,
  cheque: <FileText className="w-3.5 h-3.5" />,
};

const PAYMENT_MODE_BAR_COLORS: Record<PaymentMode, string> = {
  cash: '#1B4332',
  upi: '#2563EB',
  bank_transfer: '#D97706',
  cheque: '#7C3AED',
};

// Stagger animation variants
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ---- Custom Tooltip for recharts ----
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; payload?: Record<string, unknown> }>;
  label?: string;
}

function AreaTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-stone-500 dark:text-stone-400 text-xs mb-0.5">{label}</p>
      <p className="font-serif font-semibold text-[#0F3D3E] dark:text-emerald-300">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-stone-500 dark:text-stone-400 text-xs mb-0.5">
        {String(data.name)}
      </p>
      <p className="font-serif font-semibold text-[#0F3D3E] dark:text-emerald-300">
        {formatINR(data.value)}
      </p>
    </div>
  );
}

function BarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-stone-500 dark:text-stone-400 text-xs mb-0.5">{label}</p>
      <p className="font-serif font-semibold text-[#0F3D3E] dark:text-emerald-300">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
}

// ---- Top-Up Modal ----
interface TopUpModalProps {
  target: 'galla' | 'bank';
  onClose: () => void;
}

function TopUpModal({ target, onClose }: TopUpModalProps) {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    dispatch({
      type: 'TOP_UP_BALANCE',
      payload: {
        target,
        amount: numAmount,
        description: description || `Top-up to ${target === 'galla' ? 'Galla' : 'Bank'}`,
      },
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-[#E6E2DD] dark:border-[#2a2a2a] shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-lg font-semibold text-[#0F3D3E] dark:text-emerald-300">
            {target === 'galla' ? 'Add Cash to Galla' : 'Add to Bank'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#2a2a2a] text-stone-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2a2a2a] bg-[#FAF8F5] dark:bg-[#111] text-stone-800 dark:text-stone-200 font-serif text-lg focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cash from sales counter"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2a2a2a] bg-[#FAF8F5] dark:bg-[#111] text-stone-800 dark:text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 transition-shadow"
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-2.5 rounded-xl bg-[#0F3D3E] hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
          >
            Confirm Top-Up
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Dashboard Component
// ============================================================
export default function Dashboard() {
  const { state } = useStore();

  // ---- State for interactive elements ----
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('30d');
  const [activityFilter, setActivityFilter] = useState<'all' | 'today' | 'week'>('all');
  const [topUpTarget, setTopUpTarget] = useState<'galla' | 'bank' | null>(null);

  // ============================================================
  // Derived data computations (all memoised)
  // ============================================================

  // Filter non-topup expenses
  const realExpenses = useMemo(
    () => state.expenses.filter((e) => !e.isTopUp),
    [state.expenses]
  );

  // ----- Section 1: KPI computations -----
  const thisMonthExpenses = useMemo(
    () => realExpenses.filter((e) => isThisMonth(e.date)),
    [realExpenses]
  );
  const lastMonthExpenses = useMemo(
    () => realExpenses.filter((e) => isLastMonth(e.date)),
    [realExpenses]
  );
  const thisMonthTotal = useMemo(
    () => thisMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [thisMonthExpenses]
  );
  const lastMonthTotal = useMemo(
    () => lastMonthExpenses.reduce((s, e) => s + e.amount, 0),
    [lastMonthExpenses]
  );
  const monthPctChange = useMemo(
    () => getPercentageChange(thisMonthTotal, lastMonthTotal),
    [thisMonthTotal, lastMonthTotal]
  );

  // Cash vs Digital split
  const gallaBalance = state.shopProfile.gallaBalance;
  const bankBalance = state.shopProfile.bankBalance;
  const totalBalance = gallaBalance + bankBalance;
  const gallaPct = totalBalance > 0 ? (gallaBalance / totalBalance) * 100 : 50;
  const bankPct = totalBalance > 0 ? (bankBalance / totalBalance) * 100 : 50;

  // Payroll liability
  const currentMonth = getCurrentMonth();
  const activeEmployees = useMemo(
    () => state.employees.filter((e) => e.status === 'active'),
    [state.employees]
  );
  const totalBaseSalaries = useMemo(
    () => activeEmployees.reduce((s, e) => s + e.baseSalary, 0),
    [activeEmployees]
  );
  const totalAdvancesThisMonth = useMemo(
    () =>
      state.employeeAdvances
        .filter(
          (a) =>
            a.month === currentMonth &&
            (a.type === 'advance' || a.type === 'tea_food' || a.type === 'salary_payout')
        )
        .reduce((s, a) => s + a.amount, 0),
    [state.employeeAdvances, currentMonth]
  );
  const remainingPayable = Math.max(0, totalBaseSalaries - totalAdvancesThisMonth);

  // Pending vendor dues
  const pendingExpenses = useMemo(
    () =>
      realExpenses.filter(
        (e) => e.paymentStatus === 'pending' || e.paymentStatus === 'partially_paid'
      ),
    [realExpenses]
  );
  const pendingCount = pendingExpenses.length;
  const pendingSum = useMemo(
    () => pendingExpenses.reduce((s, e) => s + e.amount, 0),
    [pendingExpenses]
  );

  // ----- Section 2: Charts data -----

  // Expense trend (area chart) — last N days
  const trendDays = trendRange === '7d' ? 7 : 30;
  const expenseTrendData = useMemo(() => {
    const now = new Date();
    const data: { date: string; total: number }[] = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dayTotal = realExpenses
        .filter((e) => e.date.startsWith(dayStr))
        .reduce((s, e) => s + e.amount, 0);
      data.push({ date: dayLabel, total: dayTotal });
    }
    return data;
  }, [realExpenses, trendDays]);

  // Category breakdown (donut)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key as ExpenseCategory] || key,
        value,
        key,
        color: CATEGORY_COLORS[key] || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonthExpenses]);

  // Payment mode distribution (bar chart)
  const paymentModeData = useMemo(() => {
    const modes: PaymentMode[] = ['cash', 'upi', 'bank_transfer', 'cheque'];
    return modes.map((mode) => ({
      name: PAYMENT_MODE_LABELS[mode],
      shortName: mode === 'bank_transfer' ? 'Bank' : mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI' : 'Cheque',
      value: thisMonthExpenses
        .filter((e) => e.paymentMode === mode)
        .reduce((s, e) => s + e.amount, 0),
      color: PAYMENT_MODE_BAR_COLORS[mode],
    }));
  }, [thisMonthExpenses]);

  // Employee cost ratio
  const staffExpenseCategories: ExpenseCategory[] = ['staff_payroll', 'staff_welfare'];
  const staffExpenseTotal = useMemo(
    () =>
      thisMonthExpenses
        .filter((e) => staffExpenseCategories.includes(e.category))
        .reduce((s, e) => s + e.amount, 0) + totalAdvancesThisMonth,
    [thisMonthExpenses, totalAdvancesThisMonth]
  );
  const staffRatioPct = useMemo(
    () => (thisMonthTotal > 0 ? Math.round((staffExpenseTotal / thisMonthTotal) * 100) : 0),
    [staffExpenseTotal, thisMonthTotal]
  );

  // ----- Section 3: Recent activity -----
  const recentTransactions = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return realExpenses
      .filter((e) => new Date(e.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [realExpenses]);

  const filteredTransactions = useMemo(() => {
    if (activityFilter === 'today') return recentTransactions.filter((e) => isToday(e.date));
    if (activityFilter === 'week') return recentTransactions.filter((e) => isThisWeek(e.date));
    return recentTransactions;
  }, [recentTransactions, activityFilter]);

  const displayedTransactions = filteredTransactions.slice(0, 7);

  // Upcoming dues
  const upcomingDues = useMemo(
    () =>
      state.recurringBills
        .filter((rb) => rb.status === 'due_soon' || rb.status === 'overdue')
        .sort(
          (a, b) =>
            new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        ),
    [state.recurringBills]
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6 pb-8">
      {/* ================================================================ */}
      {/* SECTION 1: Top KPI Bento Grid                                    */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* ---- Card 1: Total Monthly Outflow ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Monthly Outflow
            </span>
            <div className="p-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#111]">
              <TrendingUp className="w-4 h-4 text-[#0F3D3E] dark:text-emerald-400" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {formatINR(thisMonthTotal)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            {monthPctChange <= 0 ? (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {Math.abs(monthPctChange)}% less
                </span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C94A4A]" />
                <span className="text-[#C94A4A] font-medium">
                  {monthPctChange}% more
                </span>
              </>
            )}
            <span className="text-stone-400 dark:text-stone-500 ml-0.5">vs last month</span>
          </div>
        </motion.div>

        {/* ---- Card 2: Cash vs Digital Split ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Cash vs Digital
            </span>
            <div className="p-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#111]">
              <Wallet className="w-4 h-4 text-[#C59B27] dark:text-amber-400" />
            </div>
          </div>
          <div className="space-y-3">
            {/* Galla */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                  <Banknote className="w-3.5 h-3.5" />
                  Galla
                </span>
                <span className="font-serif font-semibold text-stone-800 dark:text-stone-200">
                  {formatINR(gallaBalance)}
                </span>
              </div>
              <div className="h-2 w-full bg-[#F3EFEA] dark:bg-[#222] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gallaPct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-[#1B4332]"
                />
              </div>
            </div>
            {/* Bank */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  Digital / Bank
                </span>
                <span className="font-serif font-semibold text-stone-800 dark:text-stone-200">
                  {formatINR(bankBalance)}
                </span>
              </div>
              <div className="h-2 w-full bg-[#F3EFEA] dark:bg-[#222] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bankPct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="h-full rounded-full bg-[#2563EB]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- Card 3: Staff Payroll Liability ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Payroll Liability
            </span>
            <div className="p-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#111]">
              <Users className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {formatINR(remainingPayable)}
          </p>
          <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
            <span>
              Base: {formatINR(totalBaseSalaries)}
            </span>
            <span className="text-[#D97706] dark:text-amber-400 font-medium">
              Adv: {formatINR(totalAdvancesThisMonth)}
            </span>
          </div>
          <div className="mt-2 text-xs text-stone-400 dark:text-stone-500">
            {activeEmployees.length} active staff
          </div>
        </motion.div>

        {/* ---- Card 4: Pending Vendor Dues ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Pending Dues
            </span>
            <div className="p-1.5 rounded-lg bg-[#C94A4A]/10">
              <AlertTriangle className="w-4 h-4 text-[#C94A4A]" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            {formatINR(pendingSum)}
          </p>
          <div className="text-xs text-stone-400 dark:text-stone-500">
            {pendingCount} unpaid {pendingCount === 1 ? 'entry' : 'entries'}
          </div>
        </motion.div>
      </motion.div>

      {/* ================================================================ */}
      {/* SECTION 2: Charts                                                */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* ---- Chart 1: Expense Trend (Area) ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200">
              Expense Trend
            </h3>
            <div className="flex gap-1 bg-[#F3EFEA] dark:bg-[#222] rounded-lg p-0.5">
              <button
                onClick={() => setTrendRange('7d')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  trendRange === '7d'
                    ? 'bg-white dark:bg-[#333] text-[#0F3D3E] dark:text-emerald-300 shadow-sm'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTrendRange('30d')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  trendRange === '30d'
                    ? 'bg-white dark:bg-[#333] text-[#0F3D3E] dark:text-emerald-300 shadow-sm'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              >
                30D
              </button>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={expenseTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F3D3E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F3D3E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DD" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  interval={trendRange === '30d' ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip content={<AreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#1B4332"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#0F3D3E', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ---- Chart 2: Category Breakdown Donut ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Category Breakdown
          </h3>
          {categoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
              No expenses this month
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={`cat-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom legend */}
              <div className="w-full mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {categoryData.slice(0, 6).map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-stone-500 dark:text-stone-400 truncate flex-1">
                      {cat.name}
                    </span>
                    <span className="font-medium text-stone-700 dark:text-stone-300 font-serif">
                      {formatINR(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ---- Chart 3: Payment Mode Distribution (Horizontal Bar) ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Payment Mode Split
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentModeData}
                layout="vertical"
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DD" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {paymentModeData.map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ---- Chart 4: Employee Cost Ratio Gauge ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm flex flex-col"
        >
          <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Staff Cost Ratio
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Large arc/gauge visual */}
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#F3EFEA"
                  className="dark:stroke-[#222]"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Filled arc */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(staffRatioPct / 100) * 314} 314`}
                  initial={{ strokeDasharray: '0 314' }}
                  animate={{
                    strokeDasharray: `${(staffRatioPct / 100) * 314} 314`,
                  }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {staffRatioPct}%
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  of total
                </span>
              </div>
            </div>
            {/* Breakdown labels */}
            <div className="mt-4 w-full grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Staff Costs</p>
                <p className="font-serif text-sm font-semibold text-[#2D6A4F] dark:text-emerald-400">
                  {formatINR(staffExpenseTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">Total Expenses</p>
                <p className="font-serif text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {formatINR(thisMonthTotal)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ================================================================ */}
      {/* SECTION 3: Recent Activity & Alerts                              */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* ---- Recent Transactions ---- */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200">
              Recent Activity
            </h3>
            {/* Filter pills */}
            <div className="flex gap-1 bg-[#F3EFEA] dark:bg-[#222] rounded-lg p-0.5">
              {([
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActivityFilter(f.key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activityFilter === f.key
                      ? 'bg-white dark:bg-[#333] text-[#0F3D3E] dark:text-emerald-300 shadow-sm'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {displayedTransactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
              No transactions found
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-[#E6E2DD] dark:border-[#2a2a2a]">
                <div className="col-span-2">Date</div>
                <div className="col-span-4">Title</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2 text-center">Mode</div>
              </div>
              {/* Rows */}
              {displayedTransactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#111] transition-colors group"
                >
                  {/* Date */}
                  <div className="col-span-2 text-xs text-stone-500 dark:text-stone-400">
                    {formatDate(tx.date)}
                  </div>
                  {/* Title */}
                  <div className="col-span-4 text-sm text-stone-800 dark:text-stone-200 truncate font-medium">
                    {tx.title}
                  </div>
                  {/* Amount */}
                  <div className="col-span-2 text-right text-sm font-serif font-semibold text-stone-900 dark:text-stone-100">
                    {formatINR(tx.amount)}
                  </div>
                  {/* Category badge */}
                  <div className="col-span-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white truncate max-w-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[tx.category] || '#6B7280',
                      }}
                    >
                      {CATEGORY_LABELS[tx.category] || tx.category}
                    </span>
                  </div>
                  {/* Payment mode icon */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3EFEA] dark:bg-[#222] text-stone-600 dark:text-stone-400"
                      title={PAYMENT_MODE_LABELS[tx.paymentMode]}
                    >
                      {PAYMENT_MODE_ICONS[tx.paymentMode]}
                      <span className="hidden sm:inline">
                        {tx.paymentMode === 'cash'
                          ? 'Cash'
                          : tx.paymentMode === 'upi'
                          ? 'UPI'
                          : tx.paymentMode === 'bank_transfer'
                          ? 'Bank'
                          : 'Cheque'}
                      </span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ---- Upcoming Dues & Reminders ---- */}
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
            <h3 className="font-serif text-sm font-semibold text-stone-800 dark:text-stone-200">
              Upcoming Dues
            </h3>
          </div>

          {upcomingDues.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-400 dark:text-stone-500">
              <CalendarClock className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
              All clear! No pending dues.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingDues.map((bill) => {
                const daysLeft = getDaysUntil(bill.nextDueDate);
                const isOverdue = bill.status === 'overdue' || daysLeft < 0;

                return (
                  <div
                    key={bill.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#111] border border-[#E6E2DD]/50 dark:border-[#2a2a2a]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                        {bill.title}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                        {formatINR(bill.amount)} · {bill.frequency}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOverdue
                          ? 'bg-[#C94A4A]/10 text-[#C94A4A]'
                          : 'bg-[#D97706]/10 text-[#D97706] dark:text-amber-400'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysLeft)}d overdue`
                        : daysLeft === 0
                        ? 'Due today'
                        : `${daysLeft}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ================================================================ */}
      {/* SECTION 4: Quick Top-Up Buttons                                  */}
      {/* ================================================================ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3"
      >
        <motion.button
          variants={cardVariants}
          onClick={() => setTopUpTarget('galla')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D3E] hover:bg-[#1B4332] text-white text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Cash to Galla
        </motion.button>
        <motion.button
          variants={cardVariants}
          onClick={() => setTopUpTarget('bank')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#E6E2DD] dark:border-[#2a2a2a] text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-[#F3EFEA] dark:hover:bg-[#222] transition-colors shadow-sm"
        >
          <Building2 className="w-4 h-4" />
          Add to Bank
        </motion.button>
      </motion.div>

      {/* ---- Top-Up Modal ---- */}
      {topUpTarget !== null && (
        <TopUpModal target={topUpTarget} onClose={() => setTopUpTarget(null)} />
      )}
    </div>
  );
}
