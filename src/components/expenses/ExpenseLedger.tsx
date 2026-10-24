// ============================================================
// Bahi-Khata Modern — Expense Ledger Module
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Calendar,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  FileCheck,
  FileWarning,
  ChevronDown,
  Receipt,
  PackageOpen,
  UserCircle,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type {
  Expense,
  ExpenseCategory,
  PaymentMode,
  BillType,
  PaymentStatus,
  PaidBy,
} from '../../types';
import {
  CATEGORY_LABELS,
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../types';
import {
  formatINR,
  formatDate,
  generateId,
  CATEGORY_COLORS,
} from '../../utils/formatters';

// ---- Constants ----
type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'custom';

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

const ALL_CATEGORIES: ExpenseCategory[] = [
  'inventory_stock',
  'staff_payroll',
  'staff_welfare',
  'shop_utilities',
  'logistics_hamali',
  'petty_cash',
  'maintenance',
  'marketing',
  'vendor_payment',
  'family_withdrawal',
  'reimbursement',
  'other',
];

const ALL_PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'bank_transfer', 'cheque'];
const ALL_BILL_TYPES: BillType[] = ['pakka', 'kaccha'];
const ALL_PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'pending', 'partially_paid'];
const PAID_BY_OPTIONS: { value: PaidBy; label: string }[] = [
  { value: 'shop_galla', label: 'Shop Galla' },
  { value: 'owner_personal', label: 'Owner Personal' },
  { value: 'family_member', label: 'Family Member' },
];

const PAYMENT_MODE_ICONS: Record<PaymentMode, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />,
  upi: <Smartphone className="w-3.5 h-3.5" />,
  bank_transfer: <Building2 className="w-3.5 h-3.5" />,
  cheque: <CreditCard className="w-3.5 h-3.5" />,
};

// ---- Default form state ----
interface ExpenseFormState {
  date: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  subCategory: string;
  amount: string;
  paymentMode: PaymentMode;
  paidBy: PaidBy;
  familyMemberId: string;
  employeeId: string;
  isAdvance: boolean;
  vendorName: string;
  billType: BillType;
  gstAmount: string;
  paymentStatus: PaymentStatus;
  notes: string;
  referenceId: string;
}

const defaultFormState: ExpenseFormState = {
  date: new Date().toISOString().slice(0, 16),
  title: '',
  description: '',
  category: 'petty_cash',
  subCategory: '',
  amount: '',
  paymentMode: 'cash',
  paidBy: 'shop_galla',
  familyMemberId: '',
  employeeId: '',
  isAdvance: false,
  vendorName: '',
  billType: 'kaccha',
  gstAmount: '',
  paymentStatus: 'paid',
  notes: '',
  referenceId: '',
};

// ---- Date helpers ----
function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================
// Main Component
// ============================================================
export default function ExpenseLedger() {
  const { state, dispatch } = useStore();

  // ---- Filter state ----
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState<PaymentMode | 'all'>('all');
  const [filterBillType, setFilterBillType] = useState<BillType | 'all'>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<PaymentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Modal state ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(defaultFormState);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---- Memoised filtered expenses ----
  const filteredExpenses = useMemo(() => {
    let filtered = [...state.expenses];

    // Date filter
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (dateRange === 'today') {
      const start = getStartOfToday();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= now;
      });
    } else if (dateRange === 'this_week') {
      const start = getStartOfWeek();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= now;
      });
    } else if (dateRange === 'this_month') {
      const start = getStartOfMonth();
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= now;
      });
    } else if (dateRange === 'custom' && customDateStart && customDateEnd) {
      const start = new Date(customDateStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateEnd);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    // Category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }

    // Payment mode
    if (filterPaymentMode !== 'all') {
      filtered = filtered.filter(e => e.paymentMode === filterPaymentMode);
    }

    // Bill type
    if (filterBillType !== 'all') {
      filtered = filtered.filter(e => e.billType === filterBillType);
    }

    // Payment status
    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(e => e.paymentStatus === filterPaymentStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [
    state.expenses,
    dateRange,
    customDateStart,
    customDateEnd,
    filterCategory,
    filterPaymentMode,
    filterBillType,
    filterPaymentStatus,
    searchQuery,
  ]);

  // ---- Summary ----
  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  // ---- Modal handlers ----
  const openAddModal = useCallback(() => {
    setEditingExpenseId(null);
    setForm({ ...defaultFormState, date: new Date().toISOString().slice(0, 16) });
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((expense: Expense) => {
    setEditingExpenseId(expense.id);
    setForm({
      date: expense.date.slice(0, 16),
      title: expense.title,
      description: expense.description || '',
      category: expense.category,
      subCategory: expense.subCategory || '',
      amount: String(expense.amount),
      paymentMode: expense.paymentMode,
      paidBy: expense.paidBy,
      familyMemberId: expense.familyMemberId || '',
      employeeId: expense.employeeId || '',
      isAdvance: expense.isAdvance || false,
      vendorName: expense.vendorName || '',
      billType: expense.billType,
      gstAmount: expense.gstAmount ? String(expense.gstAmount) : '',
      paymentStatus: expense.paymentStatus,
      notes: expense.notes || '',
      referenceId: expense.referenceId || '',
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingExpenseId(null);
    setForm(defaultFormState);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof ExpenseFormState, value: string | boolean) => {
      setForm(prev => {
        const next = { ...prev, [field]: value };

        // Auto-set category to family_withdrawal when paid by family member
        if (field === 'paidBy' && value === 'family_member') {
          next.category = 'family_withdrawal';
        }

        // Reset family member when switching away
        if (field === 'paidBy' && value !== 'family_member') {
          next.familyMemberId = '';
        }

        // Reset advance when employee cleared
        if (field === 'employeeId' && value === '') {
          next.isAdvance = false;
        }

        return next;
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) return;

    const expense: Expense = {
      id: editingExpenseId || generateId(),
      date: new Date(form.date).toISOString(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      subCategory: form.subCategory.trim() || undefined,
      amount: Number(form.amount),
      paymentMode: form.paymentMode,
      paidBy: form.paidBy,
      familyMemberId: form.familyMemberId || undefined,
      employeeId: form.employeeId || undefined,
      isAdvance: form.isAdvance || undefined,
      vendorName: form.vendorName.trim() || undefined,
      billType: form.billType,
      gstAmount: form.gstAmount ? Number(form.gstAmount) : undefined,
      paymentStatus: form.paymentStatus,
      notes: form.notes.trim() || undefined,
      referenceId: form.referenceId.trim() || undefined,
      createdAt: editingExpenseId
        ? state.expenses.find(e => e.id === editingExpenseId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    if (editingExpenseId) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    } else {
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    }

    closeModal();
  }, [form, editingExpenseId, dispatch, closeModal, state.expenses]);

  const handleDelete = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
      setDeleteConfirmId(null);
    },
    [dispatch]
  );

  // ---- Helpers for lookups ----
  const getEmployeeName = useCallback(
    (id: string) => state.employees.find(e => e.id === id)?.name || 'Unknown',
    [state.employees]
  );

  const getFamilyMemberName = useCallback(
    (id: string) => state.familyMembers.find(fm => fm.id === id)?.name || 'Unknown',
    [state.familyMembers]
  );

  // ---- Category badge color ----
  const getCategoryBadgeClasses = (cat: ExpenseCategory): string => {
    const colorMap: Record<string, string> = {
      inventory_stock: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      staff_payroll: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
      staff_welfare: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      shop_utilities: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      logistics_hamali: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      petty_cash: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      maintenance: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
      marketing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      vendor_payment: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      family_withdrawal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      reimbursement: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colorMap[cat] || colorMap.other;
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1B4332] dark:text-[#D4AF37]">
            Expense Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track every paisa — Pakka or Kaccha
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4332] hover:bg-[#0F3D3E] text-white font-medium text-sm shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Expense
        </motion.button>
      </div>

      {/* ---- Filter Bar ---- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-[#E6E2DD] dark:border-gray-700 p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[#C59B27]" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRangePreset)}
              className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
            >
              {DATE_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom date range inputs */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={e => setCustomDateStart(e.target.value)}
                  className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={e => setCustomDateEnd(e.target.value)}
                  className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                />
              </div>
            </>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
              className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Payment Mode
            </label>
            <select
              value={filterPaymentMode}
              onChange={e => setFilterPaymentMode(e.target.value as PaymentMode | 'all')}
              className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
            >
              <option value="all">All Modes</option>
              {ALL_PAYMENT_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {PAYMENT_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Bill Type
            </label>
            <select
              value={filterBillType}
              onChange={e => setFilterBillType(e.target.value as BillType | 'all')}
              className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
            >
              <option value="all">All Bills</option>
              <option value="pakka">Pakka (GST)</option>
              <option value="kaccha">Kaccha</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Payment Status
            </label>
            <select
              value={filterPaymentStatus}
              onChange={e => setFilterPaymentStatus(e.target.value as PaymentStatus | 'all')}
              className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
            >
              <option value="all">All Statuses</option>
              {ALL_PAYMENT_STATUSES.map(s => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className={dateRange === 'custom' ? 'sm:col-span-2 lg:col-span-3 xl:col-span-6' : 'sm:col-span-2 lg:col-span-3 xl:col-span-2'}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search title, vendor, notes…"
                className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2 pl-9 pr-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Summary Ribbon ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F3EFEA] dark:bg-gray-800/60 rounded-xl px-5 py-3 border border-[#E6E2DD] dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Showing{' '}
          <span className="font-bold text-[#1B4332] dark:text-[#D4AF37]">{filteredExpenses.length}</span>{' '}
          of{' '}
          <span className="font-bold text-[#1B4332] dark:text-[#D4AF37]">{state.expenses.length}</span>{' '}
          transactions
        </p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1 sm:mt-0">
          Total:{' '}
          <span className="text-[#C94A4A] dark:text-red-400 font-mono tabular-nums text-base">
            {formatINR(totalFiltered)}
          </span>
        </p>
      </div>

      {/* ---- Expense Table ---- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E6E2DD] dark:border-gray-700 shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          /* ---- Empty State ---- */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#F3EFEA] dark:bg-gray-700 flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-[#C59B27]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-gray-700 dark:text-gray-200 mb-1">
              No expenses found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {state.expenses.length === 0
                ? 'Start by adding your first expense entry.'
                : 'Try adjusting your filters to see more results.'}
            </p>
            {state.expenses.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1B4332] dark:text-[#D4AF37] hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F3EFEA] dark:bg-gray-700/60 border-b border-[#E6E2DD] dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Title / Description
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Payment
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Bill
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredExpenses.map((expense, idx) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                      className={`border-b border-[#E6E2DD]/60 dark:border-gray-700/60 hover:bg-[#FAF8F5] dark:hover:bg-gray-700/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-[#FDFCFA] dark:bg-gray-800/80'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(expense.date)}</span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                          {expense.title}
                        </p>
                        {expense.vendorName && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                            {expense.vendorName}
                          </p>
                        )}
                        {expense.isAdvance && expense.employeeId && (
                          <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">
                            Advance → {getEmployeeName(expense.employeeId)}
                          </p>
                        )}
                        {expense.familyMemberId && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Family → {getFamilyMemberName(expense.familyMemberId)}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryBadgeClasses(expense.category)}`}
                        >
                          {CATEGORY_LABELS[expense.category]}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono tabular-nums font-semibold text-gray-900 dark:text-gray-50">
                          {formatINR(expense.amount)}
                        </span>
                        {expense.gstAmount != null && expense.gstAmount > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            GST: {formatINR(expense.gstAmount)}
                          </p>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {PAYMENT_MODE_ICONS[expense.paymentMode]}
                          <span className="text-xs">{PAYMENT_MODE_LABELS[expense.paymentMode].split('(')[0].trim()}</span>
                        </div>
                      </td>

                      {/* Bill Type */}
                      <td className="py-3 px-4 text-center">
                        {expense.billType === 'pakka' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <FileCheck className="w-3 h-3" />
                            Pakka
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            <FileWarning className="w-3 h-3" />
                            Kaccha
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        {expense.paymentStatus === 'paid' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            Paid
                          </span>
                        )}
                        {expense.paymentStatus === 'pending' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            Pending
                          </span>
                        )}
                        {expense.paymentStatus === 'partially_paid' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                            Partial
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {deleteConfirmId === expense.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(expense)}
                                title="Edit"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#1B4332] hover:bg-[#F3EFEA] dark:text-gray-400 dark:hover:text-[#D4AF37] dark:hover:bg-gray-700 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(expense.id)}
                                title="Delete"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#C94A4A] hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Add / Edit Expense Modal                                     */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/40 dark:bg-black/60"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl border border-[#E6E2DD] dark:border-gray-700 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E2DD] dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#C59B27]" />
                  <h2 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#D4AF37]">
                    {editingExpenseId ? 'Edit Expense' : 'New Expense'}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Date & Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => handleFormChange('date', e.target.value)}
                    className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Title / Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Electricity Bill, Stock Purchase…"
                    className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                  />
                </div>

                {/* Category + Sub-category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={e => handleFormChange('category', e.target.value)}
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    >
                      {ALL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Sub-category
                    </label>
                    <input
                      type="text"
                      value={form.subCategory}
                      onChange={e => handleFormChange('subCategory', e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.amount}
                      onChange={e => handleFormChange('amount', e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 pl-9 pr-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    />
                  </div>
                </div>

                {/* Payment Mode + Paid By row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Payment Mode
                    </label>
                    <select
                      value={form.paymentMode}
                      onChange={e => handleFormChange('paymentMode', e.target.value)}
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    >
                      {ALL_PAYMENT_MODES.map(mode => (
                        <option key={mode} value={mode}>
                          {PAYMENT_MODE_LABELS[mode]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Paid By
                    </label>
                    <select
                      value={form.paidBy}
                      onChange={e => handleFormChange('paidBy', e.target.value)}
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    >
                      {PAID_BY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Family Member dropdown — shown when paidBy is family_member */}
                {form.paidBy === 'family_member' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Family Member <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.familyMemberId}
                      onChange={e => handleFormChange('familyMemberId', e.target.value)}
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    >
                      <option value="">Select family member…</option>
                      {state.familyMembers.map(fm => (
                        <option key={fm.id} value={fm.id}>
                          {fm.name} ({fm.relation})
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* Employee (optional) + Mark as Advance */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Employee (optional — tag advance)
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={e => handleFormChange('employeeId', e.target.value)}
                    className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                  >
                    <option value="">None</option>
                    {state.employees
                      .filter(emp => emp.status === 'active')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                  </select>
                </div>

                {form.employeeId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      id="isAdvance"
                      checked={form.isAdvance}
                      onChange={e => handleFormChange('isAdvance', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#C59B27] dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label
                      htmlFor="isAdvance"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Mark as Salary Advance for{' '}
                      <span className="font-medium">{getEmployeeName(form.employeeId)}</span>
                    </label>
                  </motion.div>
                )}

                {/* Vendor / Party Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Vendor / Party Name
                  </label>
                  <input
                    type="text"
                    value={form.vendorName}
                    onChange={e => handleFormChange('vendorName', e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                  />
                </div>

                {/* Bill Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Bill Type
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billType"
                        value="pakka"
                        checked={form.billType === 'pakka'}
                        onChange={e => handleFormChange('billType', e.target.value)}
                        className="w-4 h-4 text-[#1B4332] border-gray-300 focus:ring-[#C59B27] dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-green-600" />
                        Pakka (GST Bill)
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="billType"
                        value="kaccha"
                        checked={form.billType === 'kaccha'}
                        onChange={e => handleFormChange('billType', e.target.value)}
                        className="w-4 h-4 text-[#D97706] border-gray-300 focus:ring-[#C59B27] dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <FileWarning className="w-3.5 h-3.5 text-amber-600" />
                        Kaccha
                      </span>
                    </label>
                  </div>
                </div>

                {/* GST Amount — shown only when Pakka */}
                {form.billType === 'pakka' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      GST Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.gstAmount}
                        onChange={e => handleFormChange('gstAmount', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 pl-9 pr-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={form.paymentStatus}
                    onChange={e => handleFormChange('paymentStatus', e.target.value)}
                    className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                  >
                    {ALL_PAYMENT_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {PAYMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes / Reference ID */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={e => handleFormChange('notes', e.target.value)}
                      placeholder="Optional notes"
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Reference / UTR / Bill #
                    </label>
                    <input
                      type="text"
                      value={form.referenceId}
                      onChange={e => handleFormChange('referenceId', e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-[#FAF8F5] dark:bg-gray-700 text-sm py-2.5 px-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E6E2DD] dark:border-gray-700 bg-[#FDFCFA] dark:bg-gray-800/50 rounded-b-2xl">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={!form.title.trim() || !form.amount || Number(form.amount) <= 0}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#0F3D3E] disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors"
                >
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
