// ============================================================
// Bahi-Khata Modern — Recurring Bills & Vendor Obligations
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  X,
  Building,
  Check,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { RecurringBill, ExpenseCategory, PaymentMode, Expense } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { formatINR, formatDate, generateId, getDaysUntil } from '../../utils/formatters';

export default function RecurringBills() {
  const { state, dispatch } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);

  // Mark as Paid confirmation modal state
  const [payingBill, setPayingBill] = useState<RecurringBill | null>(null);
  const [payPaymentMode, setPayPaymentMode] = useState<PaymentMode>('upi');

  // Form State
  const [formData, setFormData] = useState<Partial<RecurringBill>>({
    title: '',
    category: 'shop_utilities',
    amount: 5000,
    frequency: 'monthly',
    dueDay: 5,
    vendorName: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setSelectedBill(null);
    setFormData({
      title: '',
      category: 'shop_utilities',
      amount: 5000,
      frequency: 'monthly',
      dueDay: 5,
      vendorName: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setSelectedBill(bill);
    setFormData(bill);
    setIsModalOpen(true);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.dueDay) return;

    const now = new Date();
    const nextDue = new Date(now.getFullYear(), now.getMonth(), formData.dueDay);
    if (nextDue < now) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }

    if (selectedBill) {
      dispatch({
        type: 'UPDATE_RECURRING_BILL',
        payload: {
          ...selectedBill,
          ...formData,
          amount: Number(formData.amount),
          dueDay: Number(formData.dueDay),
        } as RecurringBill,
      });
    } else {
      const newBill: RecurringBill = {
        id: generateId(),
        title: formData.title,
        category: formData.category || 'shop_utilities',
        amount: Number(formData.amount),
        frequency: formData.frequency || 'monthly',
        dueDay: Number(formData.dueDay),
        vendorName: formData.vendorName,
        status: 'upcoming',
        nextDueDate: nextDue.toISOString(),
        notes: formData.notes,
      };
      dispatch({ type: 'ADD_RECURRING_BILL', payload: newBill });
    }
    setIsModalOpen(false);
  };

  const handleDeleteBill = (id: string) => {
    if (window.confirm('Delete this recurring obligation?')) {
      dispatch({ type: 'DELETE_RECURRING_BILL', payload: id });
    }
  };

  const handleConfirmPay = () => {
    if (!payingBill) return;

    const nowIso = new Date().toISOString();

    // 1. Mark bill as paid in recurring tracker
    dispatch({ type: 'MARK_RECURRING_PAID', payload: payingBill.id });

    // 2. Also record expense in main ledger so balance is deducted automatically!
    const expense: Expense = {
      id: generateId(),
      date: nowIso,
      title: `${payingBill.title} (Recurring Bill)`,
      category: payingBill.category,
      amount: payingBill.amount,
      paymentMode: payPaymentMode,
      paidBy: 'shop_galla',
      vendorName: payingBill.vendorName,
      billType: 'pakka',
      paymentStatus: 'paid',
      notes: `Recurring payment recorded for cycle day ${payingBill.dueDay}`,
      createdAt: nowIso,
    };
    dispatch({ type: 'ADD_EXPENSE', payload: expense });

    setPayingBill(null);
  };

  // Calculations
  const totalMonthlyCommitment = state.recurringBills.reduce((sum, b) => {
    if (b.frequency === 'yearly') return sum + b.amount / 12;
    if (b.frequency === 'quarterly') return sum + b.amount / 3;
    return sum + b.amount;
  }, 0);

  const paidThisMonthCount = state.recurringBills.filter((b) => b.status === 'paid').length;
  const pendingBills = state.recurringBills.filter((b) => b.status !== 'paid');
  const pendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
        <div>
          <h1 className="text-3xl font-serif text-[#1a1a1a] dark:text-[#f3efe9]">
            Recurring Bills & Fixed Overhead
          </h1>
          <p className="text-sm text-[#8A8780] dark:text-[#9A9892] mt-1">
            Rent, electricity, Wi-Fi, CA retainers & shop supplier subscriptions
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white hover:bg-[#0A2A2B] dark:hover:bg-[#143226] font-semibold text-sm shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Total Monthly Commitment
          </p>
          <p className="text-2xl font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9] mt-2 tabular-nums">
            {formatINR(totalMonthlyCommitment)}
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            Across {state.recurringBills.length} fixed obligations
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Settled / Paid This Cycle
          </p>
          <p className="text-2xl font-serif font-bold text-[#2D6A4F] dark:text-emerald-400 mt-2 tabular-nums">
            {paidThisMonthCount} / {state.recurringBills.length} Paid
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            {paidThisMonthCount === state.recurringBills.length && state.recurringBills.length > 0
              ? 'All fixed dues settled!'
              : `${state.recurringBills.length - paidThisMonthCount} dues pending`}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Remaining Pending Bills
          </p>
          <p className="text-2xl font-serif font-bold text-[#D97706] mt-2 tabular-nums">
            {formatINR(pendingAmount)}
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            To be settled before cycle end
          </p>
        </div>
      </div>

      {/* Bills Cards Grid */}
      {state.recurringBills.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1B1F] rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] p-12 text-center">
          <CalendarClock
            size={48}
            className="mx-auto text-[#8A8780] dark:text-[#9A9892] opacity-50 mb-3"
          />
          <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
            No Recurring Bills Tracked
          </h3>
          <p className="text-sm text-[#8A8780] dark:text-[#9A9892] max-w-md mx-auto mt-1 mb-4">
            Add recurring costs like shop rent, electricity, Wi-Fi, security, and CA fees so you never miss an invoice deadline.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#0F3D3E] text-white text-sm font-semibold hover:bg-[#0A2A2B]"
          >
            + Add First Bill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {state.recurringBills.map((bill) => {
              const daysUntil = getDaysUntil(bill.nextDueDate);
              const isOverdue = daysUntil < 0 && bill.status !== 'paid';
              const isDueSoon = daysUntil >= 0 && daysUntil <= 5 && bill.status !== 'paid';

              return (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-[#1A1B1F] rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8780] dark:text-[#9A9892]">
                          {CATEGORY_LABELS[bill.category] || bill.category}
                        </span>
                        <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9] mt-0.5">
                          {bill.title}
                        </h3>
                        {bill.vendorName && (
                          <p className="flex items-center gap-1.5 text-xs text-[#8A8780] dark:text-[#9A9892] mt-0.5">
                            <Building size={12} />
                            <span>{bill.vendorName}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(bill)}
                          title="Edit bill"
                          className="p-1.5 text-[#8A8780] hover:text-[#0F3D3E] dark:hover:text-[#D4AF37] rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-[#222328]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          title="Delete bill"
                          className="p-1.5 text-[#8A8780] hover:text-[#C94A4A] rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-[#222328]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Amount & Frequency */}
                    <div className="bg-[#FAF8F5] dark:bg-[#222328] rounded-xl p-4 border border-[#E6E2DD] dark:border-[#2A2B30] mb-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9] tabular-nums">
                          {formatINR(bill.amount)}
                        </span>
                        <span className="text-xs font-semibold uppercase text-[#8A8780] dark:text-[#9A9892]">
                          /{bill.frequency}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
                        Cycle Day: {bill.dueDay}th of the month
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {bill.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-emerald-400 border border-[#2D6A4F]/20">
                          <CheckCircle size={14} />
                          <span>Settled for this month</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C94A4A]/10 text-[#C94A4A] border border-[#C94A4A]/20">
                          <AlertTriangle size={14} />
                          <span>{Math.abs(daysUntil)} days overdue!</span>
                        </span>
                      ) : isDueSoon ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                          <Clock size={14} />
                          <span>Due in {daysUntil} days ({formatDate(bill.nextDueDate)})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#8A8780]/10 text-[#8A8780] dark:text-[#9A9892] border border-[#8A8780]/20">
                          <Calendar size={14} />
                          <span>Due on {formatDate(bill.nextDueDate)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-[#F3EFEA] dark:border-[#2A2B30]">
                    {bill.status === 'paid' ? (
                      <div className="text-center py-2 text-xs text-[#8A8780] dark:text-[#9A9892]">
                        Last paid: {bill.lastPaidDate ? formatDate(bill.lastPaidDate) : 'Recently'}
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayingBill(bill)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white hover:bg-[#0A2A2B] dark:hover:bg-[#143226] text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        <span>Mark as Paid & Record Expense</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal: Add/Edit Bill */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-md w-full p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
                <h3 className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                  {selectedBill ? 'Edit Recurring Obligation' : 'Add Recurring Obligation'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBill} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Bill Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Shop Rent, Electricity, Broadband"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.amount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: Number(e.target.value) })
                      }
                      placeholder="15000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E] tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                      Due Day (1-31) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={formData.dueDay || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDay: Number(e.target.value) })
                      }
                      placeholder="5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category || 'shop_utilities'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as ExpenseCategory,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                    >
                      <option value="shop_utilities">Shop Utilities</option>
                      <option value="petty_cash">Daily Petty Cash</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency || 'monthly'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly',
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Vendor / Landlord / Agency Name
                  </label>
                  <input
                    type="text"
                    value={formData.vendorName || ''}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="e.g., Shri Mahesh Properties, MSEDCL, Jio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DD] dark:border-[#2A2B30]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#8A8780]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#0A2A2B] shadow-sm"
                  >
                    Save Obligation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Payment & Auto Deduct */}
      <AnimatePresence>
        {payingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-sm w-full p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#0F3D3E]/10 dark:bg-[#D4AF37]/20 text-[#0F3D3E] dark:text-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} />
              </div>

              <h3 className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                Settle {payingBill.title}
              </h3>
              <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1 mb-4">
                Record payment of <strong>{formatINR(payingBill.amount)}</strong> to{' '}
                {payingBill.vendorName || 'Vendor'}.
              </p>

              <div className="text-left mb-4">
                <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={payPaymentMode}
                  onChange={(e) => setPayPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-sm text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                >
                  <option value="upi">
                    UPI (Google Pay / PhonePe / Paytm) — Deducts from Bank
                  </option>
                  <option value="cash">
                    Cash (Galla) — Deducts from Physical Cash Drawer
                  </option>
                  <option value="bank_transfer">
                    Bank Transfer (NEFT / IMPS) — Deducts from Bank
                  </option>
                  <option value="cheque">Cheque — Deducts from Bank</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] text-sm font-semibold text-[#1a1a1a] dark:text-[#f3efe9]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#0A2A2B] shadow-sm"
                >
                  Confirm & Deduct
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
