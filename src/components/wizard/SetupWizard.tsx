// ============================================================
// Bahi-Khata Modern — Setup Wizard (4-Step Onboarding)
// ============================================================
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Users,
  Briefcase,
  Rocket,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  IndianRupee,
  Phone,
  Calendar,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Employee, FamilyMember, ShopProfile, EmployeeRole } from '../../types';
import { generateId, formatINR } from '../../utils/formatters';

// ---- Step indicator config ----
const STEPS = [
  { label: 'Shop Profile', icon: Store },
  { label: 'Family Members', icon: Users },
  { label: 'Employees', icon: Briefcase },
  { label: 'Launch', icon: Rocket },
] as const;

const EMPLOYEE_ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'salesman', label: 'Salesman' },
  { value: 'helper', label: 'Helper' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'manager', label: 'Manager' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other', label: 'Other' },
];

// ---- Slide animation variants ----
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ---- Draft types for wizard-local state ----
interface DraftFamilyMember {
  id: string;
  name: string;
  relation: string;
  monthlyBudget: number;
  phone: string;
}

interface DraftEmployee {
  id: string;
  name: string;
  role: EmployeeRole;
  baseSalary: number;
  joiningDate: string;
  salaryCycleDay: number;
}

// ---- Shared input classes ----
const inputClasses =
  'w-full rounded-lg border border-[#E6E2DD] bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 ' +
  'focus:border-[#0F3D3E] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]/20 transition-colors ' +
  'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20';

const labelClasses = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide';

// ============================================================
// Main Component
// ============================================================
export default function SetupWizard() {
  const { dispatch } = useStore();

  // Step navigation
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Step 1: Shop Profile
  const [shopName, setShopName] = useState('');
  const [openingGalla, setOpeningGalla] = useState<number>(0);
  const [openingBank, setOpeningBank] = useState<number>(0);

  // Step 2: Family Members
  const [familyMembers, setFamilyMembers] = useState<DraftFamilyMember[]>([]);

  // Step 3: Employees
  const [employees, setEmployees] = useState<DraftEmployee[]>([]);

  // ---- Navigation helpers ----
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // ---- Family member helpers ----
  const addFamilyMember = useCallback(() => {
    setFamilyMembers((prev) => [
      ...prev,
      { id: generateId(), name: '', relation: '', monthlyBudget: 0, phone: '' },
    ]);
  }, []);

  const updateFamilyMember = useCallback(
    (id: string, field: keyof DraftFamilyMember, value: string | number) => {
      setFamilyMembers((prev) =>
        prev.map((fm) => (fm.id === id ? { ...fm, [field]: value } : fm))
      );
    },
    []
  );

  const removeFamilyMember = useCallback((id: string) => {
    setFamilyMembers((prev) => prev.filter((fm) => fm.id !== id));
  }, []);

  // ---- Employee helpers ----
  const addEmployee = useCallback(() => {
    setEmployees((prev) => [
      ...prev,
      {
        id: generateId(),
        name: '',
        role: 'salesman' as EmployeeRole,
        baseSalary: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        salaryCycleDay: 1,
      },
    ]);
  }, []);

  const updateEmployee = useCallback(
    (id: string, field: keyof DraftEmployee, value: string | number) => {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
      );
    },
    []
  );

  const removeEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }, []);

  // ---- Demo data handler ----
  const handleLoadDemo = useCallback(() => {
    dispatch({ type: 'LOAD_DEMO_DATA' });
  }, [dispatch]);

  // ---- Complete Setup handler ----
  const handleCompleteSetup = useCallback(() => {
    const shopProfile: ShopProfile = {
      shopName: shopName || 'My Shop',
      gallaBalance: openingGalla,
      bankBalance: openingBank,
      openingGallaBalance: openingGalla,
      openingBankBalance: openingBank,
    };

    const finalFamilyMembers: FamilyMember[] = familyMembers
      .filter((fm) => fm.name.trim())
      .map((fm) => ({
        id: fm.id,
        name: fm.name.trim(),
        relation: fm.relation.trim() || 'Member',
        monthlyBudget: fm.monthlyBudget,
        walletBalance: fm.monthlyBudget,
        phone: fm.phone.trim() || undefined,
      }));

    const finalEmployees: Employee[] = employees
      .filter((emp) => emp.name.trim())
      .map((emp) => ({
        id: emp.id,
        name: emp.name.trim(),
        role: emp.role,
        joiningDate: emp.joiningDate,
        baseSalary: emp.baseSalary,
        phone: undefined,
        status: 'active' as const,
        salaryCycleDay: emp.salaryCycleDay,
      }));

    dispatch({
      type: 'COMPLETE_SETUP',
      payload: {
        shopProfile,
        employees: finalEmployees,
        familyMembers: finalFamilyMembers,
      },
    });
  }, [dispatch, shopName, openingGalla, openingBank, familyMembers, employees]);

  // ---- Derived summary values ----
  const totalFamilyBudget = familyMembers.reduce((sum, fm) => sum + fm.monthlyBudget, 0);
  const totalPayroll = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
  const validFamilyCount = familyMembers.filter((fm) => fm.name.trim()).length;
  const validEmployeeCount = employees.filter((emp) => emp.name.trim()).length;

  // ============================================================
  // Step 1: Shop Profile & Opening Balances
  // ============================================================
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F3D3E] to-[#1B4332] flex items-center justify-center shadow-lg"
        >
          <Store className="w-8 h-8 text-[#D4AF37]" />
        </motion.div>
        <h2 className="text-3xl font-serif text-[#0F3D3E] dark:text-emerald-300">
          Welcome to Bahi-Khata
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up your family shop ledger in minutes
        </p>
      </div>

      {/* Shop Name */}
      <div>
        <label className={labelClasses}>Shop Name</label>
        <input
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="e.g., Gupta General Store"
          className={inputClasses}
        />
      </div>

      {/* Opening Galla */}
      <div>
        <label className={labelClasses}>Opening Cash in Galla (₹)</label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            value={openingGalla || ''}
            onChange={(e) => setOpeningGalla(Number(e.target.value))}
            placeholder="0"
            min={0}
            className={`${inputClasses} pl-9`}
          />
        </div>
      </div>

      {/* Opening Bank */}
      <div>
        <label className={labelClasses}>Opening Bank / UPI Account Balance (₹)</label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            value={openingBank || ''}
            onChange={(e) => setOpeningBank(Number(e.target.value))}
            placeholder="0"
            min={0}
            className={`${inputClasses} pl-9`}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={handleLoadDemo}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#E6E2DD] bg-[#F3EFEA] px-5 py-3 text-sm font-medium text-gray-700 hover:bg-[#E6E2DD] transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Skip & Load Sample Demo Data
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0F3D3E] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#1B4332] transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Start With My Shop Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ============================================================
  // Step 2: Family Members
  // ============================================================
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif text-[#0F3D3E] dark:text-emerald-300">
          Family Members Who Draw from the Shop
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track personal withdrawals, budgets, and reimbursements
        </p>
      </div>

      {/* Family member cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {familyMembers.map((fm, idx) => (
            <motion.div
              key={fm.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative rounded-xl border border-[#E6E2DD] bg-[#FAF8F5] p-4 space-y-3 dark:bg-gray-800 dark:border-gray-600"
            >
              {/* Card header with badge & remove */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F3D3E] dark:text-emerald-400 bg-[#0F3D3E]/10 dark:bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  Member {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFamilyMember(fm.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#C94A4A] hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <input
                    type="text"
                    value={fm.name}
                    onChange={(e) => updateFamilyMember(fm.id, 'name', e.target.value)}
                    placeholder="Full Name"
                    className={inputClasses}
                  />
                </div>

                {/* Relation / Title */}
                <div>
                  <label className={labelClasses}>Relation / Title</label>
                  <input
                    type="text"
                    value={fm.relation}
                    onChange={(e) => updateFamilyMember(fm.id, 'relation', e.target.value)}
                    placeholder="e.g., Father / Head, Elder Brother, Self"
                    className={inputClasses}
                  />
                </div>

                {/* Monthly Budget */}
                <div>
                  <label className={labelClasses}>Monthly Budget / Drawing Limit (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={fm.monthlyBudget || ''}
                      onChange={(e) =>
                        updateFamilyMember(fm.id, 'monthlyBudget', Number(e.target.value))
                      }
                      placeholder="0"
                      min={0}
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClasses}>Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={fm.phone}
                      onChange={(e) => updateFamilyMember(fm.id, 'phone', e.target.value)}
                      placeholder="Mobile number"
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add family member button */}
      <button
        type="button"
        onClick={addFamilyMember}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E6E2DD] px-4 py-3 text-sm font-medium text-gray-500 hover:border-[#0F3D3E] hover:text-[#0F3D3E] hover:bg-[#0F3D3E]/5 transition-all dark:border-gray-600 dark:text-gray-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/5"
      >
        <UserPlus className="w-4 h-4" />
        Add Family Member
      </button>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 rounded-lg border border-[#E6E2DD] px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#F3EFEA] transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#0F3D3E] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1B4332] transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ============================================================
  // Step 3: Shop Employees
  // ============================================================
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif text-[#0F3D3E] dark:text-emerald-300">
          Your Shop Employees
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up salaries, advances, and monthly settlement tracking
        </p>
      </div>

      {/* Employee cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {employees.map((emp, idx) => (
            <motion.div
              key={emp.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative rounded-xl border border-[#E6E2DD] bg-[#FAF8F5] p-4 space-y-3 dark:bg-gray-800 dark:border-gray-600"
            >
              {/* Card header with badge & remove */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400 bg-[#2D6A4F]/10 dark:bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  Employee {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEmployee(emp.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#C94A4A] hover:bg-red-50 transition-colors dark:hover:bg-red-900/30"
                  title="Remove employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee Name */}
                <div>
                  <label className={labelClasses}>Employee Name</label>
                  <input
                    type="text"
                    value={emp.name}
                    onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)}
                    placeholder="Full Name"
                    className={inputClasses}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className={labelClasses}>Role</label>
                  <select
                    value={emp.role}
                    onChange={(e) =>
                      updateEmployee(emp.id, 'role', e.target.value as EmployeeRole)
                    }
                    className={inputClasses}
                  >
                    {EMPLOYEE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fixed Monthly Salary */}
                <div>
                  <label className={labelClasses}>Fixed Monthly Salary (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={emp.baseSalary || ''}
                      onChange={(e) =>
                        updateEmployee(emp.id, 'baseSalary', Number(e.target.value))
                      }
                      placeholder="0"
                      min={0}
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label className={labelClasses}>Joining Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={emp.joiningDate}
                      onChange={(e) => updateEmployee(emp.id, 'joiningDate', e.target.value)}
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>

                {/* Salary Cycle Day */}
                <div className="sm:col-span-2">
                  <label className={labelClasses}>Salary Cycle Day (1–31)</label>
                  <input
                    type="number"
                    value={emp.salaryCycleDay}
                    onChange={(e) =>
                      updateEmployee(
                        emp.id,
                        'salaryCycleDay',
                        Math.max(1, Math.min(31, Number(e.target.value)))
                      )
                    }
                    min={1}
                    max={31}
                    className={`${inputClasses} max-w-[120px]`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add employee button */}
      <button
        type="button"
        onClick={addEmployee}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E6E2DD] px-4 py-3 text-sm font-medium text-gray-500 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition-all dark:border-gray-600 dark:text-gray-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/5"
      >
        <Plus className="w-4 h-4" />
        Add Employee
      </button>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 rounded-lg border border-[#E6E2DD] px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#F3EFEA] transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#0F3D3E] px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#1B4332] transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ============================================================
  // Step 4: Confirmation & Launch
  // ============================================================
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#0F3D3E] to-[#2D6A4F] flex items-center justify-center shadow-lg"
        >
          <CheckCircle2 className="w-8 h-8 text-[#D4AF37]" />
        </motion.div>
        <h2 className="text-2xl font-serif text-[#164032] dark:text-[#D4AF37]">
          Ready to Open Shop!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review your setup before starting
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-[#E6E2DD] bg-[#FAF8F5] overflow-hidden dark:bg-gray-800 dark:border-gray-600">
        {/* Shop profile row */}
        <div className="p-4 border-b border-[#E6E2DD] dark:border-gray-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F3D3E]/10 dark:bg-emerald-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#0F3D3E] dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Shop
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {shopName || 'My Shop'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white dark:bg-gray-700 p-3 border border-[#E6E2DD] dark:border-gray-600">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Galla Balance
              </p>
              <p className="text-lg font-bold text-[#0F3D3E] dark:text-emerald-400">
                {formatINR(openingGalla)}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-700 p-3 border border-[#E6E2DD] dark:border-gray-600">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Bank Balance
              </p>
              <p className="text-lg font-bold text-[#0F3D3E] dark:text-emerald-400">
                {formatINR(openingBank)}
              </p>
            </div>
          </div>
        </div>

        {/* Family members row */}
        <div className="p-4 border-b border-[#E6E2DD] dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Family Members
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {validFamilyCount} {validFamilyCount === 1 ? 'member' : 'members'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Total Monthly Budget
              </p>
              <p className="text-base font-bold text-[#C59B27]">
                {formatINR(totalFamilyBudget)}
              </p>
            </div>
          </div>
        </div>

        {/* Employees row */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2D6A4F]/10 dark:bg-emerald-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#2D6A4F] dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Employees
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {validEmployeeCount} {validEmployeeCount === 1 ? 'employee' : 'employees'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Total Monthly Payroll
              </p>
              <p className="text-base font-bold text-[#2D6A4F] dark:text-emerald-400">
                {formatINR(totalPayroll)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 rounded-lg border border-[#E6E2DD] px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#F3EFEA] transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={handleCompleteSetup}
          className="btn-tactile flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#164032] hover:bg-[#0E2B22] px-5 py-3 text-sm font-bold text-white shadow-md transition-all dark:bg-[#D4AF37] dark:text-[#141518] dark:hover:bg-[#C59B27]"
        >
          <Store className="w-4 h-4" />
          Open Shop Dashboard
        </button>
      </div>
    </div>
  );

  // ---- Step renderer map ----
  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4];

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Card */}
        <div className="rounded-2xl border border-[#E6E2DD] bg-white shadow-xl shadow-black/5 dark:bg-gray-800 dark:border-gray-700 dark:shadow-black/30 overflow-hidden">
          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 px-6 pt-6 pb-2">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = idx === step;
              const isCompleted = idx < step;
              return (
                <div key={idx} className="flex items-center gap-2">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div
                      className={`hidden sm:block w-8 h-0.5 rounded-full transition-colors duration-300 ${
                        isCompleted
                          ? 'bg-[#0F3D3E] dark:bg-emerald-500'
                          : 'bg-[#E6E2DD] dark:bg-gray-600'
                      }`}
                    />
                  )}
                  {/* Step dot */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (idx < step) {
                        setDirection(-1);
                        setStep(idx);
                      }
                    }}
                    disabled={idx > step}
                    whileHover={idx <= step ? { scale: 1.1 } : undefined}
                    whileTap={idx <= step ? { scale: 0.95 } : undefined}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-[#0F3D3E] text-white shadow-md shadow-[#0F3D3E]/25 dark:bg-emerald-600'
                        : isCompleted
                        ? 'bg-[#0F3D3E]/20 text-[#0F3D3E] dark:bg-emerald-500/20 dark:text-emerald-400 cursor-pointer'
                        : 'bg-[#F3EFEA] text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    title={s.label}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="step-ring"
                        className="absolute -inset-1 rounded-full border-2 border-[#0F3D3E] dark:border-emerald-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Step label */}
          <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
            Step {step + 1} of {STEPS.length}{' '}
            <span className="text-gray-400 dark:text-gray-500">·</span>{' '}
            {STEPS[step].label}
          </p>

          {/* Step content with slide animation */}
          <div className="relative px-6 pb-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                {stepRenderers[step]()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer credit */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-4">
          Bahi-Khata Modern — Your trusted digital ledger for the family shop
        </p>
      </motion.div>
    </div>
  );
}
