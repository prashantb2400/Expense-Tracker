// ============================================================
// Bahi-Khata Modern — Staff & Payroll Management Module
// ============================================================
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowDownCircle,
  CheckCircle,
  AlertTriangle,
  Phone,
  Calendar,
  Briefcase,
  X,
  ChevronDown,
  FileText,
  IndianRupee,
} from 'lucide-react';
import { useStore, useEmployeeMonthSummary } from '../../store/useStore';
import type {
  Employee,
  EmployeeAdvance,
  EmployeeRole,
  EmployeeStatus,
  PaymentMode,
  MonthlySettlement,
  Expense,
} from '../../types';
import {
  EMPLOYEE_ROLE_LABELS,
  PAYMENT_MODE_LABELS,
} from '../../types';
import {
  formatINR,
  formatDate,
  generateId,
  getCurrentMonth,
  getMonthLabel,
} from '../../utils/formatters';

// ============================================================
// Constants
// ============================================================
const ADVANCE_TYPE_LABELS: Record<string, string> = {
  advance: 'Advance / Upaad',
  tea_food: 'Tea / Food Allowance',
  bonus: 'Bonus',
  deduction: 'Deduction',
  salary_payout: 'Salary Payout',
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  salesman: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  helper: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cashier: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  on_leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  inactive: 'Inactive',
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

// ============================================================
// Utility: generate available months for selectors
// ============================================================
function getAvailableMonths(count = 12): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// ============================================================
// Sub-component: EmployeeCard
// ============================================================
interface EmployeeCardProps {
  employee: Employee;
  onEdit: (emp: Employee) => void;
  onDelete: (id: string) => void;
  onGiveAdvance: (emp: Employee) => void;
  onSettleSalary: (emp: Employee) => void;
  onViewStatement: (emp: Employee) => void;
}

function EmployeeCard({
  employee,
  onEdit,
  onDelete,
  onGiveAdvance,
  onSettleSalary,
  onViewStatement,
}: EmployeeCardProps) {
  const { totalAdvances, totalDeductions, totalBonuses, baseSalary, isSettled } =
    useEmployeeMonthSummary(employee.id);

  const totalTaken = totalAdvances + totalDeductions;
  const remaining = baseSalary - totalTaken;
  const isOverdrawn = remaining < 0;
  const progressPercent = baseSalary > 0 ? Math.min((totalTaken / baseSalary) * 100, 100) : 0;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 border border-[#E6E2DD] dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5"
    >
      {/* Header row: Name, Role, Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-[#1B4332] dark:text-emerald-300 truncate">
            {employee.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[employee.role]}`}
            >
              {EMPLOYEE_ROLE_LABELS[employee.role]}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[employee.status]}`}
            >
              {STATUS_LABELS[employee.status]}
            </span>
            {isSettled && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                <CheckCircle size={12} />
                Settled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact & joining info */}
      <div className="space-y-1.5 mb-4 text-sm text-gray-600 dark:text-gray-400">
        {employee.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span>{employee.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>Joined {formatDate(employee.joiningDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>
            Base Salary: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatINR(baseSalary)}</span>
          </span>
        </div>
      </div>

      {/* Salary Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>Salary Progress ({getMonthLabel(getCurrentMonth())})</span>
          {totalBonuses > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">+{formatINR(totalBonuses)} bonus</span>
          )}
        </div>
        <div className="w-full h-3 rounded-full bg-[#F3EFEA] dark:bg-gray-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isOverdrawn
                ? 'bg-[#C94A4A]'
                : 'bg-[#1B4332] dark:bg-emerald-500'
            }`}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Taken: <span className="font-medium text-gray-700 dark:text-gray-300">{formatINR(totalTaken)}</span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Remaining:{' '}
            <span
              className={`font-medium ${
                isOverdrawn ? 'text-[#C94A4A]' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {formatINR(Math.abs(remaining))}
            </span>
          </span>
        </div>
        {isOverdrawn && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle size={14} className="text-[#C94A4A] flex-shrink-0" />
            <span className="text-xs font-medium text-[#C94A4A]">
              ⚠️ Over-drawn by {formatINR(Math.abs(remaining))}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewStatement(employee)}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
        >
          <FileText size={13} />
          Statement
        </button>
        <button
          onClick={() => onGiveAdvance(employee)}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#C59B27] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37] hover:bg-[#D4AF37]/20 dark:hover:bg-[#D4AF37]/30 transition-colors"
        >
          <ArrowDownCircle size={13} />
          Advance
        </button>
        <button
          onClick={() => onSettleSalary(employee)}
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1B4332]/10 text-[#1B4332] dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-[#1B4332]/20 dark:hover:bg-emerald-900/50 transition-colors"
        >
          <Wallet size={13} />
          Settle
        </button>
        <button
          onClick={() => onEdit(employee)}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(employee.id)}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg text-[#C94A4A] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component: EmployeeManager
// ============================================================
type ModalType = null | 'add_edit_employee' | 'give_advance' | 'settle_salary' | 'view_statement';

export default function EmployeeManager() {
  const { state, dispatch } = useStore();

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Advance form state
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceType, setAdvanceType] = useState<EmployeeAdvance['type']>('advance');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [advancePaymentMode, setAdvancePaymentMode] = useState<PaymentMode>('cash');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Settle form state
  const [settlePaymentMode, setSettlePaymentMode] = useState<PaymentMode>('cash');

  // Statement state
  const [statementMonth, setStatementMonth] = useState(getCurrentMonth());

  // Add/Edit employee form state
  const [empFormName, setEmpFormName] = useState('');
  const [empFormRole, setEmpFormRole] = useState<EmployeeRole>('salesman');
  const [empFormSalary, setEmpFormSalary] = useState('');
  const [empFormPhone, setEmpFormPhone] = useState('');
  const [empFormJoiningDate, setEmpFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empFormSalaryCycleDay, setEmpFormSalaryCycleDay] = useState('1');
  const [empFormStatus, setEmpFormStatus] = useState<EmployeeStatus>('active');

  // Confirmation dialog for delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available months for selectors
  const availableMonths = useMemo(() => getAvailableMonths(12), []);

  // ---- Handlers ----

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpFormName('');
    setEmpFormRole('salesman');
    setEmpFormSalary('');
    setEmpFormPhone('');
    setEmpFormJoiningDate(new Date().toISOString().split('T')[0]);
    setEmpFormSalaryCycleDay('1');
    setEmpFormStatus('active');
    setActiveModal('add_edit_employee');
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpFormName(emp.name);
    setEmpFormRole(emp.role);
    setEmpFormSalary(String(emp.baseSalary));
    setEmpFormPhone(emp.phone || '');
    setEmpFormJoiningDate(emp.joiningDate.split('T')[0]);
    setEmpFormSalaryCycleDay(String(emp.salaryCycleDay));
    setEmpFormStatus(emp.status);
    setActiveModal('add_edit_employee');
  };

  const handleSaveEmployee = () => {
    if (!empFormName.trim() || !empFormSalary) return;

    const employeeData: Employee = {
      id: editingEmployee?.id || generateId(),
      name: empFormName.trim(),
      role: empFormRole,
      baseSalary: Number(empFormSalary),
      phone: empFormPhone.trim() || undefined,
      joiningDate: new Date(empFormJoiningDate).toISOString(),
      salaryCycleDay: Number(empFormSalaryCycleDay) || 1,
      status: empFormStatus,
    };

    if (editingEmployee) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: employeeData });
    } else {
      dispatch({ type: 'ADD_EMPLOYEE', payload: employeeData });
    }
    setActiveModal(null);
  };

  const handleDeleteEmployee = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: deleteConfirmId });
      setDeleteConfirmId(null);
    }
  };

  const openGiveAdvance = (emp: Employee) => {
    setSelectedEmployee(emp);
    setAdvanceAmount('');
    setAdvanceType('advance');
    setAdvanceDescription('');
    setAdvancePaymentMode('cash');
    setAdvanceDate(new Date().toISOString().split('T')[0]);
    setActiveModal('give_advance');
  };

  const handleSaveAdvance = () => {
    if (!selectedEmployee || !advanceAmount || Number(advanceAmount) <= 0) return;

    const advance: EmployeeAdvance = {
      id: generateId(),
      employeeId: selectedEmployee.id,
      date: new Date(advanceDate).toISOString(),
      amount: Number(advanceAmount),
      type: advanceType,
      description: advanceDescription.trim() || ADVANCE_TYPE_LABELS[advanceType],
      paymentMode: advancePaymentMode,
      month: getCurrentMonth(),
    };

    dispatch({ type: 'ADD_EMPLOYEE_ADVANCE', payload: advance });
    setActiveModal(null);
  };

  const openSettleSalary = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSettlePaymentMode('cash');
    setActiveModal('settle_salary');
  };

  const openViewStatement = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStatementMonth(getCurrentMonth());
    setActiveModal('view_statement');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedEmployee(null);
    setEditingEmployee(null);
    setDeleteConfirmId(null);
  };

  // ---- Render ----
  const employees = state.employees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 dark:bg-emerald-900/30 flex items-center justify-center">
            <Users size={20} className="text-[#1B4332] dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1B4332] dark:text-emerald-300">
              Staff & Payroll
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employees.length} employee{employees.length !== 1 ? 's' : ''} • {getMonthLabel(getCurrentMonth())}
            </p>
          </div>
        </div>
        <button
          onClick={openAddEmployee}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] dark:bg-emerald-700 text-white font-medium text-sm hover:bg-[#0F3D3E] dark:hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      {/* Employee Directory Grid */}
      {employees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-[#E6E2DD] dark:border-gray-700"
        >
          <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Employees Added
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            Add your shop staff to manage payroll, advances, and settlements.
          </p>
          <button
            onClick={openAddEmployee}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B4332] dark:bg-emerald-700 text-white text-sm font-medium hover:bg-[#0F3D3E] dark:hover:bg-emerald-600 transition-colors"
          >
            <Plus size={16} />
            Add First Employee
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onEdit={openEditEmployee}
                onDelete={handleDeleteEmployee}
                onGiveAdvance={openGiveAdvance}
                onSettleSalary={openSettleSalary}
                onViewStatement={openViewStatement}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ======================================== */}
      {/* Delete Confirmation Dialog */}
      {/* ======================================== */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-[#C94A4A]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Delete Employee?</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This will permanently remove this employee and all their advance records. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#C94A4A] text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================== */}
      {/* Add/Edit Employee Modal */}
      {/* ======================================== */}
      <AnimatePresence>
        {activeModal === 'add_edit_employee' && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E6E2DD] dark:border-gray-700">
                <h3 className="text-lg font-bold text-[#1B4332] dark:text-emerald-300 font-serif">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Employee Name <span className="text-[#C94A4A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={empFormName}
                    onChange={(e) => setEmpFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                  />
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        value={empFormRole}
                        onChange={(e) => setEmpFormRole(e.target.value as EmployeeRole)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
                      >
                        {Object.entries(EMPLOYEE_ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={empFormStatus}
                        onChange={(e) => setEmpFormStatus(e.target.value as EmployeeStatus)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
                      >
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Base Monthly Salary (₹) <span className="text-[#C94A4A]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={empFormSalary}
                      onChange={(e) => setEmpFormSalary(e.target.value)}
                      placeholder="15000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={empFormPhone}
                    onChange={(e) => setEmpFormPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                  />
                </div>

                {/* Joining Date & Salary Cycle Day */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={empFormJoiningDate}
                      onChange={(e) => setEmpFormJoiningDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Salary Cycle Day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={empFormSalaryCycleDay}
                      onChange={(e) => setEmpFormSalaryCycleDay(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-[#E6E2DD] dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmployee}
                  disabled={!empFormName.trim() || !empFormSalary}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#1B4332] dark:bg-emerald-700 text-white hover:bg-[#0F3D3E] dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================== */}
      {/* Give Advance Modal */}
      {/* ======================================== */}
      <AnimatePresence>
        {activeModal === 'give_advance' && selectedEmployee && (
          <GiveAdvanceModal
            employee={selectedEmployee}
            advanceAmount={advanceAmount}
            setAdvanceAmount={setAdvanceAmount}
            advanceType={advanceType}
            setAdvanceType={setAdvanceType}
            advanceDescription={advanceDescription}
            setAdvanceDescription={setAdvanceDescription}
            advancePaymentMode={advancePaymentMode}
            setAdvancePaymentMode={setAdvancePaymentMode}
            advanceDate={advanceDate}
            setAdvanceDate={setAdvanceDate}
            onSave={handleSaveAdvance}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ======================================== */}
      {/* Settle Salary Modal */}
      {/* ======================================== */}
      <AnimatePresence>
        {activeModal === 'settle_salary' && selectedEmployee && (
          <SettleSalaryModal
            employee={selectedEmployee}
            settlePaymentMode={settlePaymentMode}
            setSettlePaymentMode={setSettlePaymentMode}
            dispatch={dispatch}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ======================================== */}
      {/* View Statement Modal */}
      {/* ======================================== */}
      <AnimatePresence>
        {activeModal === 'view_statement' && selectedEmployee && (
          <StatementModal
            employee={selectedEmployee}
            statementMonth={statementMonth}
            setStatementMonth={setStatementMonth}
            availableMonths={availableMonths}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Give Advance Modal Component
// ============================================================
interface GiveAdvanceModalProps {
  employee: Employee;
  advanceAmount: string;
  setAdvanceAmount: (v: string) => void;
  advanceType: EmployeeAdvance['type'];
  setAdvanceType: (v: EmployeeAdvance['type']) => void;
  advanceDescription: string;
  setAdvanceDescription: (v: string) => void;
  advancePaymentMode: PaymentMode;
  setAdvancePaymentMode: (v: PaymentMode) => void;
  advanceDate: string;
  setAdvanceDate: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function GiveAdvanceModal({
  employee,
  advanceAmount,
  setAdvanceAmount,
  advanceType,
  setAdvanceType,
  advanceDescription,
  setAdvanceDescription,
  advancePaymentMode,
  setAdvancePaymentMode,
  advanceDate,
  setAdvanceDate,
  onSave,
  onClose,
}: GiveAdvanceModalProps) {
  const { totalAdvances, totalDeductions, totalBonuses, baseSalary, netPayable } =
    useEmployeeMonthSummary(employee.id);

  const totalTaken = totalAdvances + totalDeductions;
  const remaining = baseSalary - totalTaken;

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6E2DD] dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-[#1B4332] dark:text-emerald-300 font-serif">
              Give Advance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              to <span className="font-medium text-gray-700 dark:text-gray-300">{employee.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current month summary */}
        <div className="mx-6 mt-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-gray-700/50 border border-[#E6E2DD] dark:border-gray-600">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {getMonthLabel(getCurrentMonth())} Summary
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Base Salary</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatINR(baseSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Taken So Far</p>
              <p className="text-sm font-bold text-[#D97706]">{formatINR(totalTaken)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              <p className={`text-sm font-bold ${remaining < 0 ? 'text-[#C94A4A]' : 'text-[#2D6A4F]'}`}>
                {formatINR(Math.abs(remaining))}
                {remaining < 0 && ' (over)'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (₹) <span className="text-[#C94A4A]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">₹</span>
              <input
                type="number"
                min={0}
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type
            </label>
            <div className="relative">
              <select
                value={advanceType}
                onChange={(e) => setAdvanceType(e.target.value as EmployeeAdvance['type'])}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
              >
                <option value="advance">Advance / Upaad</option>
                <option value="tea_food">Tea / Food Allowance</option>
                <option value="bonus">Bonus</option>
                <option value="deduction">Deduction</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={advanceDescription}
              onChange={(e) => setAdvanceDescription(e.target.value)}
              placeholder="e.g. Weekly advance, Chai paani"
              className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Payment Mode
            </label>
            <div className="relative">
              <select
                value={advancePaymentMode}
                onChange={(e) => setAdvancePaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
              >
                {Object.entries(PAYMENT_MODE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={advanceDate}
              onChange={(e) => setAdvanceDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#E6E2DD] dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!advanceAmount || Number(advanceAmount) <= 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#C59B27] text-white hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Advance
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Settle Salary Modal Component
// ============================================================
interface SettleSalaryModalProps {
  employee: Employee;
  settlePaymentMode: PaymentMode;
  setSettlePaymentMode: (v: PaymentMode) => void;
  dispatch: React.Dispatch<any>;
  onClose: () => void;
}

function SettleSalaryModal({
  employee,
  settlePaymentMode,
  setSettlePaymentMode,
  dispatch,
  onClose,
}: SettleSalaryModalProps) {
  const {
    totalAdvances,
    totalDeductions,
    totalBonuses,
    baseSalary,
    netPayable,
    isSettled,
    settlement,
  } = useEmployeeMonthSummary(employee.id);

  const handleSettle = () => {
    const now = new Date().toISOString();
    const currentMonth = getCurrentMonth();

    // 1. Create settlement record (store reducer automatically records payout advance and expense)
    const settlementRecord: MonthlySettlement = {
      employeeId: employee.id,
      month: currentMonth,
      baseSalary,
      totalAdvances,
      totalBonuses,
      totalDeductions,
      netPaid: netPayable,
      settledAt: now,
      isSettled: true,
    };

    dispatch({ type: 'SETTLE_MONTHLY_SALARY', payload: settlementRecord });
    onClose();
  };

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6E2DD] dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-[#1B4332] dark:text-emerald-300 font-serif">
              Settle Monthly Salary
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {employee.name} • {getMonthLabel(getCurrentMonth())}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Already settled badge */}
        {isSettled && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ Already Settled
              </p>
              {settlement?.settledAt && (
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                  Settled on {formatDate(settlement.settledAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Salary Breakdown */}
        <div className="p-6 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Base Salary</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatINR(baseSalary)}</span>
            </div>
            {totalBonuses > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">+ Bonuses</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  +{formatINR(totalBonuses)}
                </span>
              </div>
            )}
            {totalAdvances > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#D97706]">− Advances Taken</span>
                <span className="font-medium text-[#D97706]">−{formatINR(totalAdvances)}</span>
              </div>
            )}
            {totalDeductions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#C94A4A]">− Deductions</span>
                <span className="font-medium text-[#C94A4A]">−{formatINR(totalDeductions)}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-[#E6E2DD] dark:border-gray-600 my-3" />

          {/* Net Payable */}
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Net Payable</span>
            <span
              className={`text-2xl font-serif font-bold ${
                netPayable >= 0
                  ? 'text-[#1B4332] dark:text-emerald-300'
                  : 'text-[#C94A4A]'
              }`}
            >
              {formatINR(Math.abs(netPayable))}
              {netPayable < 0 && (
                <span className="text-sm ml-1">(overdrawn)</span>
              )}
            </span>
          </div>

          {/* Payment Mode (only if not settled) */}
          {!isSettled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Payment Mode
              </label>
              <div className="relative">
                <select
                  value={settlePaymentMode}
                  onChange={(e) => setSettlePaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
                >
                  {Object.entries(PAYMENT_MODE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#E6E2DD] dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
          >
            {isSettled ? 'Close' : 'Cancel'}
          </button>
          {!isSettled && (
            <button
              onClick={handleSettle}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[#1B4332] dark:bg-emerald-700 text-white hover:bg-[#0F3D3E] dark:hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle size={16} />
              Confirm & Settle
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Statement Modal Component
// ============================================================
interface StatementModalProps {
  employee: Employee;
  statementMonth: string;
  setStatementMonth: (v: string) => void;
  availableMonths: string[];
  onClose: () => void;
}

function StatementModal({
  employee,
  statementMonth,
  setStatementMonth,
  availableMonths,
  onClose,
}: StatementModalProps) {
  const {
    advances,
    totalAdvances,
    totalBonuses,
    totalDeductions,
    baseSalary,
    netPayable,
    salaryPaid,
    isSettled,
  } = useEmployeeMonthSummary(employee.id, statementMonth);

  // Sort advances chronologically
  const sortedAdvances = useMemo(
    () =>
      [...advances].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [advances]
  );

  // Build running balance for passbook view
  const ledgerRows = useMemo(() => {
    let runningBalance = baseSalary;
    return sortedAdvances.map((adv) => {
      let debit = 0;
      let credit = 0;
      if (adv.type === 'bonus') {
        credit = adv.amount;
        runningBalance += adv.amount;
      } else if (adv.type === 'salary_payout') {
        debit = adv.amount;
        // Salary payout doesn't change salary balance – it's the final payment
        // but for passbook view, show it as debit from remaining
        runningBalance -= adv.amount;
      } else {
        // advance, tea_food, deduction
        debit = adv.amount;
        runningBalance -= adv.amount;
      }
      return {
        ...adv,
        debit,
        credit,
        balance: runningBalance,
      };
    });
  }, [sortedAdvances, baseSalary]);

  const remaining = netPayable - salaryPaid;

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E6E2DD] dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#1B4332] dark:text-emerald-300 font-serif">
              Staff Statement
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {employee.name} — {EMPLOYEE_ROLE_LABELS[employee.role]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Month selector */}
            <div className="relative">
              <select
                value={statementMonth}
                onChange={(e) => setStatementMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E6E2DD] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#1B4332]/20 dark:focus:ring-emerald-500/20 focus:border-[#1B4332] dark:focus:border-emerald-500 outline-none transition-colors text-sm appearance-none pr-8"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F3EFEA] dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Ledger table */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Opening balance row */}
          <div className="mb-4 p-3 rounded-xl bg-[#FAF8F5] dark:bg-gray-700/50 border border-[#E6E2DD] dark:border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Opening Balance (Base Salary)</span>
              <span className="text-sm font-bold text-[#1B4332] dark:text-emerald-300">{formatINR(baseSalary)}</span>
            </div>
          </div>

          {sortedAdvances.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No transactions for {getMonthLabel(statementMonth)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E6E2DD] dark:border-gray-700">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#C94A4A] uppercase tracking-wide">
                      Debit
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#2D6A4F] uppercase tracking-wide">
                      Credit
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-[#E6E2DD]/60 dark:border-gray-700/60 hover:bg-[#FAF8F5] dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            row.type === 'bonus'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : row.type === 'deduction'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : row.type === 'salary_payout'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {ADVANCE_TYPE_LABELS[row.type]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#C94A4A] whitespace-nowrap">
                        {row.debit > 0 ? `−${formatINR(row.debit)}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#2D6A4F] whitespace-nowrap">
                        {row.credit > 0 ? `+${formatINR(row.credit)}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {formatINR(row.balance)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary at bottom */}
          <div className="mt-6 p-4 rounded-xl bg-[#FAF8F5] dark:bg-gray-700/50 border border-[#E6E2DD] dark:border-gray-600 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Month Summary
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Advances</p>
                <p className="text-sm font-bold text-[#D97706]">{formatINR(totalAdvances)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bonuses</p>
                <p className="text-sm font-bold text-[#2D6A4F]">{formatINR(totalBonuses)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Net Payable</p>
                <p className="text-sm font-bold text-[#1B4332] dark:text-emerald-300">{formatINR(netPayable)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                <p className={`text-sm font-bold ${remaining > 0 ? 'text-[#D97706]' : remaining < 0 ? 'text-[#C94A4A]' : 'text-[#2D6A4F]'}`}>
                  {formatINR(Math.abs(remaining))}
                  {remaining < 0 && ' (over)'}
                </p>
              </div>
            </div>
            {isSettled && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-green-600 dark:text-green-400">
                <CheckCircle size={14} />
                <span className="text-xs font-medium">This month has been settled</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#E6E2DD] dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E6E2DD] dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-[#F3EFEA] dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
