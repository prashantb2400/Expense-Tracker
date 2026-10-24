// ============================================================
// Bahi-Khata Modern — Family Members Manager & Wallet Ledger
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Phone,
  Calendar,
  X,
  CreditCard,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { useStore, useFamilyMemberSummary } from '../../store/useStore';
import type { FamilyMember, FamilyTransaction, Expense } from '../../types';
import { formatINR, formatDate, generateId, getCurrentMonth } from '../../utils/formatters';

interface FamilyCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onViewLedger: (member: FamilyMember) => void;
  onReimburse: (member: FamilyMember, amount: number) => void;
  onLogWithdrawal: (member: FamilyMember) => void;
}

function FamilyMemberCard({
  member,
  onEdit,
  onDelete,
  onViewLedger,
  onReimburse,
  onLogWithdrawal,
}: FamilyCardProps) {
  const { totalWithdrawn, budgetUsed, budgetRemaining, shopOwes, transactions } =
    useFamilyMemberSummary(member.id);

  const budgetPct = member.monthlyBudget > 0
    ? Math.min(100, Math.round((budgetUsed / member.monthlyBudget) * 100))
    : 0;

  const isOverBudget = budgetUsed > member.monthlyBudget;
  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-[#1A1B1F] rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                {member.name}
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#0F3D3E]/10 dark:bg-[#D4AF37]/20 text-[#0F3D3E] dark:text-[#D4AF37] border border-[#0F3D3E]/20 dark:border-[#D4AF37]/30">
                {member.relation}
              </span>
            </div>
            {member.phone && (
              <p className="flex items-center gap-1.5 text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
                <Phone size={12} />
                <span>+91 {member.phone}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(member)}
              title="Edit member"
              className="p-1.5 text-[#8A8780] hover:text-[#0F3D3E] dark:hover:text-[#D4AF37] rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-[#222328] transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(member.id)}
              title="Delete member"
              className="p-1.5 text-[#8A8780] hover:text-[#C94A4A] rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-[#222328] transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Monthly Budget & Progress */}
        <div className="bg-[#FAF8F5] dark:bg-[#222328] rounded-xl p-4 border border-[#E6E2DD] dark:border-[#2A2B30] mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#8A8780] dark:text-[#9A9892] font-medium">
              Monthly Drawing Limit
            </span>
            <span className="font-bold text-[#1a1a1a] dark:text-[#f3efe9] tabular-nums">
              {formatINR(member.monthlyBudget)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-[#E6E2DD] dark:bg-[#2A2B30] rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-[#C94A4A]'
                  : budgetPct > 80
                  ? 'bg-[#D97706]'
                  : 'bg-[#0F3D3E] dark:bg-[#D4AF37]'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className="text-[#8A8780] dark:text-[#9A9892]">
              Drawn:{' '}
              <strong className="text-[#1a1a1a] dark:text-[#f3efe9]">
                {formatINR(totalWithdrawn)}
              </strong>{' '}
              ({budgetPct}%)
            </span>
            <span
              className={`font-semibold ${
                budgetRemaining < 0
                  ? 'text-[#C94A4A]'
                  : 'text-[#2D6A4F] dark:text-emerald-400'
              }`}
            >
              {budgetRemaining >= 0
                ? `${formatINR(budgetRemaining)} left`
                : `Exceeded by ${formatINR(Math.abs(budgetRemaining))}`}
            </span>
          </div>
        </div>

        {/* Shop Owes Widget (Personal Spent for Shop) */}
        {shopOwes > 0 && (
          <div className="bg-[#FEF3C7]/60 dark:bg-[#D97706]/10 border border-[#D97706]/30 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft size={16} className="text-[#D97706]" />
              <div>
                <p className="text-xs text-[#92400E] dark:text-[#FBBF24] font-medium">
                  Shop Owes Personal Reimbursement
                </p>
                <p className="text-sm font-bold text-[#92400E] dark:text-[#FBBF24] tabular-nums">
                  {formatINR(shopOwes)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onReimburse(member, shopOwes)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#D97706] text-white hover:bg-[#B45309] shadow-sm transition-all"
            >
              Settle
            </button>
          </div>
        )}

        {/* Recent Transactions Snippet */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase tracking-wider mb-2">
            Recent Activity
          </p>
          {recentTx.length === 0 ? (
            <p className="text-xs text-[#8A8780] dark:text-[#6B6B70] italic">
              No transactions this month
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#F3EFEA] dark:border-[#2A2B30] last:border-0"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        tx.type === 'withdrawal'
                          ? 'bg-[#C94A4A]'
                          : tx.type === 'personal_for_shop'
                          ? 'bg-[#D97706]'
                          : 'bg-[#2D6A4F]'
                      }`}
                    />
                    <span className="truncate text-[#1a1a1a] dark:text-[#f3efe9]">
                      {tx.description}
                    </span>
                  </div>
                  <span
                    className={`font-semibold tabular-nums shrink-0 ${
                      tx.type === 'withdrawal'
                        ? 'text-[#C94A4A]'
                        : tx.type === 'personal_for_shop'
                        ? 'text-[#D97706]'
                        : 'text-[#2D6A4F]'
                    }`}
                  >
                    {tx.type === 'withdrawal' ? '-' : '+'}
                    {formatINR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#F3EFEA] dark:border-[#2A2B30] flex items-center gap-2">
        <button
          onClick={() => onLogWithdrawal(member)}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white hover:bg-[#0A2A2B] dark:hover:bg-[#143226] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <ArrowUpRight size={14} />
          <span>Draw Cash</span>
        </button>
        <button
          onClick={() => onViewLedger(member)}
          className="py-2 px-3 text-xs font-semibold rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] text-[#1a1a1a] dark:text-[#f3efe9] hover:bg-[#FAF8F5] dark:hover:bg-[#222328] transition-colors flex items-center gap-1"
        >
          <Receipt size={14} />
          <span>Passbook</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function FamilyManager() {
  const { state, dispatch } = useStore();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [reimburseAmount, setReimburseAmount] = useState<number>(0);

  // Form State for Add/Edit
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    relation: 'Head / Owner',
    monthlyBudget: 20000,
    walletBalance: 20000,
    phone: '',
  });

  // Form State for Quick Withdrawal / Personal Expense
  const [txData, setTxData] = useState({
    amount: '',
    description: '',
    type: 'withdrawal' as 'withdrawal' | 'personal_for_shop',
    paymentMode: 'cash' as 'cash' | 'upi',
  });

  const handleOpenAdd = () => {
    setSelectedMember(null);
    setFormData({
      name: '',
      relation: 'Head / Owner',
      monthlyBudget: 20000,
      walletBalance: 20000,
      phone: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData(member);
    setIsEditModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (selectedMember) {
      dispatch({
        type: 'UPDATE_FAMILY_MEMBER',
        payload: {
          ...selectedMember,
          ...formData,
          monthlyBudget: Number(formData.monthlyBudget) || 0,
        } as FamilyMember,
      });
    } else {
      const newMember: FamilyMember = {
        id: generateId(),
        name: formData.name,
        relation: formData.relation || 'Family Member',
        monthlyBudget: Number(formData.monthlyBudget) || 0,
        walletBalance: Number(formData.monthlyBudget) || 0,
        phone: formData.phone,
      };
      dispatch({ type: 'ADD_FAMILY_MEMBER', payload: newMember });
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this family member and their records?')) {
      dispatch({ type: 'DELETE_FAMILY_MEMBER', payload: id });
    }
  };

  const handleOpenWithdrawal = (member: FamilyMember) => {
    setSelectedMember(member);
    setTxData({
      amount: '',
      description: 'Personal drawing from shop',
      type: 'withdrawal',
      paymentMode: 'cash',
    });
    setIsWithdrawalModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !txData.amount) return;
    const amount = Number(txData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const currentM = getCurrentMonth();
    const nowIso = new Date().toISOString();

    if (txData.type === 'withdrawal') {
      // 1. Add family transaction
      const ft: FamilyTransaction = {
        id: generateId(),
        familyMemberId: selectedMember.id,
        date: nowIso,
        amount,
        type: 'withdrawal',
        description: txData.description || 'Personal Withdrawal',
        month: currentM,
      };
      dispatch({ type: 'ADD_FAMILY_TRANSACTION', payload: ft });

      // 2. Also log as Expense with category 'family_withdrawal' to auto-deduct shop balance
      const exp: Expense = {
        id: generateId(),
        date: nowIso,
        title: `Family Draw: ${selectedMember.name} (${txData.description || 'Personal'})`,
        category: 'family_withdrawal',
        amount,
        paymentMode: txData.paymentMode,
        paidBy: 'shop_galla',
        familyMemberId: selectedMember.id,
        billType: 'kaccha',
        paymentStatus: 'paid',
        createdAt: nowIso,
      };
      dispatch({ type: 'ADD_EXPENSE', payload: exp });
    } else {
      // Member paid from pocket for shop work -> Shop owes member
      const ft: FamilyTransaction = {
        id: generateId(),
        familyMemberId: selectedMember.id,
        date: nowIso,
        amount,
        type: 'personal_for_shop',
        description: txData.description || 'Paid personal pocket for shop work',
        month: currentM,
      };
      dispatch({ type: 'ADD_FAMILY_TRANSACTION', payload: ft });
    }

    setIsWithdrawalModalOpen(false);
  };

  const handleOpenReimburse = (member: FamilyMember, amount: number) => {
    setSelectedMember(member);
    setReimburseAmount(amount);
    setIsReimburseModalOpen(true);
  };

  const handleConfirmReimburse = () => {
    if (!selectedMember || reimburseAmount <= 0) return;
    const nowIso = new Date().toISOString();
    const currentM = getCurrentMonth();

    // 1. Add reimburse transaction
    const ft: FamilyTransaction = {
      id: generateId(),
      familyMemberId: selectedMember.id,
      date: nowIso,
      amount: reimburseAmount,
      type: 'reimburse',
      description: `Reimbursement settled for shop expenses`,
      month: currentM,
    };
    dispatch({ type: 'ADD_FAMILY_TRANSACTION', payload: ft });

    // 2. Log expense to deduct cash/bank
    const exp: Expense = {
      id: generateId(),
      date: nowIso,
      title: `Reimbursement Paid: ${selectedMember.name}`,
      category: 'reimbursement',
      amount: reimburseAmount,
      paymentMode: 'cash',
      paidBy: 'shop_galla',
      familyMemberId: selectedMember.id,
      billType: 'kaccha',
      paymentStatus: 'paid',
      createdAt: nowIso,
    };
    dispatch({ type: 'ADD_EXPENSE', payload: exp });

    setIsReimburseModalOpen(false);
  };

  const memberLedgerTransactions = selectedMember
    ? state.familyTransactions
        .filter((ft) => ft.familyMemberId === selectedMember.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalFamilyBudget = state.familyMembers.reduce(
    (sum, m) => sum + (m.monthlyBudget || 0),
    0
  );
  const totalFamilyDrawnThisMonth = state.familyTransactions
    .filter((ft) => ft.type === 'withdrawal' && ft.month === getCurrentMonth())
    .reduce((sum, ft) => sum + ft.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
        <div>
          <h1 className="text-3xl font-serif text-[#1a1a1a] dark:text-[#f3efe9]">
            Family Members & Khata
          </h1>
          <p className="text-sm text-[#8A8780] dark:text-[#9A9892] mt-1">
            Track personal drawings, monthly limits, and family shop reimbursements
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white hover:bg-[#0A2A2B] dark:hover:bg-[#143226] font-semibold text-sm shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Aggregate Family Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Total Monthly Drawing Pool
          </p>
          <p className="text-2xl font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9] mt-2 tabular-nums">
            {formatINR(totalFamilyBudget)}
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            Across {state.familyMembers.length} family members
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Total Drawn This Month
          </p>
          <p className="text-2xl font-serif font-bold text-[#C94A4A] mt-2 tabular-nums">
            {formatINR(totalFamilyDrawnThisMonth)}
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            {totalFamilyBudget > 0
              ? `${Math.round((totalFamilyDrawnThisMonth / totalFamilyBudget) * 100)}% of limit consumed`
              : 'No limits set'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] p-5 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
          <p className="text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase">
            Remaining Family Buffer
          </p>
          <p className="text-2xl font-serif font-bold text-[#2D6A4F] dark:text-emerald-400 mt-2 tabular-nums">
            {formatINR(Math.max(0, totalFamilyBudget - totalFamilyDrawnThisMonth))}
          </p>
          <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1">
            Available to draw this month
          </p>
        </div>
      </div>

      {/* Family Member Cards Grid */}
      {state.familyMembers.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1B1F] rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] p-12 text-center">
          <Users size={48} className="mx-auto text-[#8A8780] dark:text-[#9A9892] opacity-50 mb-3" />
          <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
            No Family Members Added
          </h3>
          <p className="text-sm text-[#8A8780] dark:text-[#9A9892] max-w-md mx-auto mt-1 mb-4">
            Add family heads, partners, or brothers who draw personal living expenses or make purchases for the shop.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#0F3D3E] text-white text-sm font-semibold hover:bg-[#0A2A2B]"
          >
            + Add First Family Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {state.familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteMember}
                onViewLedger={(m) => {
                  setSelectedMember(m);
                  setIsLedgerModalOpen(true);
                }}
                onReimburse={handleOpenReimburse}
                onLogWithdrawal={handleOpenWithdrawal}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal: Add / Edit Family Member */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-md w-full p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
                <h3 className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                  {selectedMember ? 'Edit Family Member' : 'Add Family Member'}
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Rajesh Gupta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Role / Relation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.relation || ''}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    placeholder="e.g., Father / Head, Elder Brother, Self"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Monthly Budget / Drawing Limit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.monthlyBudget || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyBudget: Number(e.target.value) })
                    }
                    placeholder="25000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DD] dark:border-[#2A2B30]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#0A2A2B] shadow-sm"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Draw Cash / Personal Expense */}
      <AnimatePresence>
        {isWithdrawalModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-md w-full p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                    Family Transaction
                  </h3>
                  <p className="text-xs text-[#8A8780] dark:text-[#9A9892]">
                    Tagging for {selectedMember.name} ({selectedMember.relation})
                  </p>
                </div>
                <button
                  onClick={() => setIsWithdrawalModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="mt-4 space-y-4">
                {/* Transaction Type Radio */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxData({ ...txData, type: 'withdrawal' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      txData.type === 'withdrawal'
                        ? 'border-[#0F3D3E] dark:border-[#D4AF37] bg-[#0F3D3E]/5 dark:bg-[#D4AF37]/10 text-[#0F3D3E] dark:text-[#D4AF37] font-bold'
                        : 'border-[#E6E2DD] dark:border-[#2A2B30] text-[#8A8780]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowUpRight size={14} />
                      <span>Draw From Shop</span>
                    </div>
                    <span className="font-normal text-[11px] block opacity-80">
                      Personal cash draw, deducts shop balance & limit
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxData({ ...txData, type: 'personal_for_shop' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      txData.type === 'personal_for_shop'
                        ? 'border-[#D97706] bg-[#D97706]/10 text-[#D97706] font-bold'
                        : 'border-[#E6E2DD] dark:border-[#2A2B30] text-[#8A8780]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowDownLeft size={14} />
                      <span>Paid for Shop</span>
                    </div>
                    <span className="font-normal text-[11px] block opacity-80">
                      Paid from personal pocket, shop owes reimbursement
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    autoFocus
                    value={txData.amount}
                    onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
                    placeholder="e.g., 2000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E] tabular-nums"
                  />
                </div>

                {txData.type === 'withdrawal' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                      Paid From (Shop Balance)
                    </label>
                    <select
                      value={txData.paymentMode}
                      onChange={(e) =>
                        setTxData({ ...txData, paymentMode: e.target.value as 'cash' | 'upi' })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-sm text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                    >
                      <option value="cash">
                        Cash Galla (Available: {formatINR(state.shopProfile.gallaBalance)})
                      </option>
                      <option value="upi">
                        Bank / UPI (Available: {formatINR(state.shopProfile.bankBalance)})
                      </option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] uppercase mb-1">
                    Purpose / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={txData.description}
                    onChange={(e) => setTxData({ ...txData, description: e.target.value })}
                    placeholder="e.g., Medical expenses, vehicle fuel, grocery"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-sm text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E2DD] dark:border-[#2A2B30]">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawalModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#8A8780]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#0A2A2B] shadow-sm"
                  >
                    Confirm & Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Settle Reimbursement */}
      <AnimatePresence>
        {isReimburseModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-sm w-full p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#D97706]/10 text-[#D97706] flex items-center justify-center mx-auto mb-3">
                <RefreshCw size={24} />
              </div>

              <h3 className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                Settle Reimbursement
              </h3>
              <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1 mb-4">
                Pay back personal money spent by <strong>{selectedMember.name}</strong> for shop work.
              </p>

              <div className="bg-[#FAF8F5] dark:bg-[#222328] p-4 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] mb-4">
                <p className="text-xs text-[#8A8780] dark:text-[#9A9892]">Reimbursement Due</p>
                <p className="text-2xl font-bold font-serif text-[#D97706] mt-1 tabular-nums">
                  {formatINR(reimburseAmount)}
                </p>
                <p className="text-[11px] text-[#8A8780] dark:text-[#9A9892] mt-1">
                  Will be deducted from Cash Drawer (Galla)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReimburseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] text-sm font-semibold text-[#1a1a1a] dark:text-[#f3efe9]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReimburse}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#0A2A2B] shadow-sm"
                >
                  Pay & Settle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Full Family Passbook Ledger */}
      <AnimatePresence>
        {isLedgerModalOpen && selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1B1F] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 border border-[#E6E2DD] dark:border-[#2A2B30] shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
                    {selectedMember.name}’s Khata Passbook
                  </h3>
                  <p className="text-xs text-[#8A8780] dark:text-[#9A9892]">
                    Chronological audit of drawings, allowances & reimbursements
                  </p>
                </div>
                <button
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-y-auto my-4 border border-[#E6E2DD] dark:border-[#2A2B30] rounded-xl">
                {memberLedgerTransactions.length === 0 ? (
                  <div className="p-8 text-center text-[#8A8780] text-sm italic">
                    No transactions recorded for this family member yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF8F5] dark:bg-[#222328] text-xs font-semibold text-[#8A8780] dark:text-[#9A9892] border-b border-[#E6E2DD] dark:border-[#2A2B30]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2DD] dark:divide-[#2A2B30]">
                      {memberLedgerTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-[#FAF8F5] dark:hover:bg-[#222328]/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-[#8A8780] dark:text-[#9A9892] whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-[#1a1a1a] dark:text-[#f3efe9]">
                            {tx.description}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                tx.type === 'withdrawal'
                                  ? 'bg-[#C94A4A]/10 text-[#C94A4A]'
                                  : tx.type === 'personal_for_shop'
                                  ? 'bg-[#D97706]/10 text-[#D97706]'
                                  : 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                              }`}
                            >
                              {tx.type === 'withdrawal'
                                ? 'Cash Drawn'
                                : tx.type === 'personal_for_shop'
                                ? 'Paid For Shop'
                                : 'Reimbursed'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-xs font-bold tabular-nums text-right ${
                              tx.type === 'withdrawal'
                                ? 'text-[#C94A4A]'
                                : tx.type === 'personal_for_shop'
                                ? 'text-[#D97706]'
                                : 'text-[#2D6A4F]'
                            }`}
                          >
                            {tx.type === 'withdrawal' ? '-' : '+'}
                            {formatINR(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-3 border-t border-[#E6E2DD] dark:border-[#2A2B30] flex justify-end">
                <button
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#222328] border border-[#E6E2DD] dark:border-[#2A2B30] text-sm font-semibold text-[#1a1a1a] dark:text-[#f3efe9]"
                >
                  Close Passbook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
