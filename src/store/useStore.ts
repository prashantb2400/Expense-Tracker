// ============================================================
// Bahi-Khata Modern — Synchronized Global State Store
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, Expense, EmployeeAdvance, FamilyTransaction } from '../types';
import { createDemoState, seedRecurringBills } from '../utils/seedData';
import { generateId, getCurrentMonth, getMonthLabel, isThisMonth } from '../utils/formatters';

const STORAGE_KEY = 'bahi-khata-state';

const defaultState: AppState = {
  isSetupComplete: false,
  shopProfile: {
    shopName: '',
    gallaBalance: 0,
    bankBalance: 0,
    openingGallaBalance: 0,
    openingBankBalance: 0,
  },
  expenses: [],
  employees: [],
  employeeAdvances: [],
  monthlySettlements: [],
  familyMembers: [],
  familyTransactions: [],
  recurringBills: [],
  darkMode: false,
  activeTab: 'dashboard',
};

// ============================================================
// Master Synchronization & Reconciliation Engine
// Guarantees all balances, advances, family limits, and expenses
// are 100% mathematically and relationally in sync at all times.
// ============================================================
export function reconcileStoreState(state: AppState): AppState {
  const currentMonth = getCurrentMonth();

  // 1. Determine Opening Balances
  const openingGalla = Number(state.shopProfile.openingGallaBalance) || 0;
  const openingBank = Number(state.shopProfile.openingBankBalance) || 0;

  // 2. Compute exact live Galla & Bank balances from master transaction list
  let gallaBalance = openingGalla;
  let bankBalance = openingBank;

  for (const exp of state.expenses) {
    const amt = Number(exp.amount) || 0;
    if (exp.isTopUp) {
      if (exp.topUpTarget === 'galla') {
        gallaBalance += amt;
      } else {
        bankBalance += amt;
      }
    } else if (exp.paymentStatus !== 'pending') {
      if (exp.paymentMode === 'cash') {
        gallaBalance -= amt;
      } else {
        bankBalance -= amt;
      }
    }
  }

  // 3. Reconcile Employee Advances from Expenses
  // Any expense marked isAdvance or category staff_welfare / staff_payroll with employeeId
  const employeeAdvances = [...state.employeeAdvances];
  for (const exp of state.expenses) {
    if (exp.employeeId && (exp.isAdvance || exp.category === 'staff_welfare')) {
      const exists = employeeAdvances.some(
        (a) =>
          a.id === exp.id ||
          (a.employeeId === exp.employeeId && a.date === exp.date && a.amount === exp.amount)
      );
      if (!exists) {
        const d = new Date(exp.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        employeeAdvances.push({
          id: exp.id,
          employeeId: exp.employeeId,
          date: exp.date,
          amount: exp.amount,
          type: exp.isAdvance ? 'advance' : 'tea_food',
          description: exp.title,
          paymentMode: exp.paymentMode,
          month: m,
        });
      }
    }
  }

  // 4. Reconcile Family Transactions & Live Wallet Balances
  const familyTransactions = [...state.familyTransactions];
  for (const exp of state.expenses) {
    if (exp.familyMemberId && exp.category === 'family_withdrawal') {
      const exists = familyTransactions.some(
        (ft) =>
          ft.id === exp.id ||
          ft.expenseId === exp.id ||
          (ft.familyMemberId === exp.familyMemberId && ft.date === exp.date && ft.amount === exp.amount)
      );
      if (!exists) {
        const d = new Date(exp.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        familyTransactions.push({
          id: exp.id,
          familyMemberId: exp.familyMemberId,
          date: exp.date,
          amount: exp.amount,
          type: 'withdrawal',
          description: exp.title,
          expenseId: exp.id,
          month: m,
        });
      }
    }
  }

  // Recalculate each family member's current wallet balance
  const updatedFamilyMembers = state.familyMembers.map((fm) => {
    const totalDrawnThisMonth = familyTransactions
      .filter(
        (t) =>
          t.familyMemberId === fm.id &&
          t.month === currentMonth &&
          t.type === 'withdrawal'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...fm,
      walletBalance: (fm.monthlyBudget || 0) - totalDrawnThisMonth,
    };
  });

  // 5. Reconcile Recurring Bills Payment Status
  const recurringBills = state.recurringBills.map((rb) => {
    const isPaidInExpenses = state.expenses.some((e) => {
      const titleMatch =
        e.title.toLowerCase().includes(rb.title.toLowerCase()) ||
        (rb.vendorName && e.vendorName?.toLowerCase().includes(rb.vendorName.toLowerCase()));
      return titleMatch && isThisMonth(e.date) && e.paymentStatus === 'paid';
    });

    if (isPaidInExpenses && rb.status !== 'paid') {
      return {
        ...rb,
        status: 'paid' as const,
      };
    }
    return rb;
  });

  return {
    ...state,
    shopProfile: {
      ...state.shopProfile,
      gallaBalance,
      bankBalance,
    },
    familyMembers: updatedFamilyMembers,
    familyTransactions,
    employeeAdvances,
    recurringBills,
  };
}

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return reconcileStoreState({ ...defaultState, ...parsed });
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'COMPLETE_SETUP': {
      const initialShop = action.payload.shopProfile;
      const initialGalla = Number(initialShop.openingGallaBalance) || 0;
      const initialBank = Number(initialShop.openingBankBalance) || 0;

      return reconcileStoreState({
        ...state,
        isSetupComplete: true,
        shopProfile: {
          shopName: initialShop.shopName,
          openingGallaBalance: initialGalla,
          openingBankBalance: initialBank,
          gallaBalance: initialGalla,
          bankBalance: initialBank,
        },
        employees: action.payload.employees,
        familyMembers: action.payload.familyMembers,
        expenses: [],
        employeeAdvances: [],
        monthlySettlements: [],
        familyTransactions: [],
        recurringBills: state.recurringBills.length > 0 ? state.recurringBills : seedRecurringBills,
      });
    }

    case 'LOAD_DEMO_DATA': {
      return reconcileStoreState(createDemoState());
    }

    case 'RESET_APP': {
      localStorage.removeItem(STORAGE_KEY);
      return defaultState;
    }

    case 'SET_TAB': {
      return { ...state, activeTab: action.payload };
    }

    case 'TOGGLE_DARK_MODE': {
      return { ...state, darkMode: !state.darkMode };
    }

    case 'ADD_EXPENSE': {
      const exp = action.payload;
      const newState: AppState = {
        ...state,
        expenses: [exp, ...state.expenses.filter((e) => e.id !== exp.id)],
      };
      return reconcileStoreState(newState);
    }

    case 'UPDATE_EXPENSE': {
      const exp = action.payload;
      const newState: AppState = {
        ...state,
        expenses: state.expenses.map((e) => (e.id === exp.id ? exp : e)),
        employeeAdvances: state.employeeAdvances.map((a) =>
          a.id === exp.id ? { ...a, amount: exp.amount, description: exp.title } : a
        ),
        familyTransactions: state.familyTransactions.map((ft) =>
          ft.id === exp.id || ft.expenseId === exp.id
            ? { ...ft, amount: exp.amount, description: exp.title }
            : ft
        ),
      };
      return reconcileStoreState(newState);
    }

    case 'DELETE_EXPENSE': {
      const id = action.payload;
      const newState: AppState = {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== id),
        employeeAdvances: state.employeeAdvances.filter((a) => a.id !== id),
        familyTransactions: state.familyTransactions.filter(
          (t) => t.id !== id && t.expenseId !== id
        ),
      };
      return reconcileStoreState(newState);
    }

    case 'ADD_EMPLOYEE': {
      return { ...state, employees: [...state.employees, action.payload] };
    }

    case 'UPDATE_EMPLOYEE': {
      return {
        ...state,
        employees: state.employees.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    }

    case 'DELETE_EMPLOYEE': {
      const empId = action.payload;
      const newState: AppState = {
        ...state,
        employees: state.employees.filter((e) => e.id !== empId),
        employeeAdvances: state.employeeAdvances.filter((a) => a.employeeId !== empId),
        expenses: state.expenses.filter((e) => e.employeeId !== empId),
      };
      return reconcileStoreState(newState);
    }

    case 'ADD_EMPLOYEE_ADVANCE': {
      const adv = action.payload;
      const emp = state.employees.find((e) => e.id === adv.employeeId);
      const isPayout = adv.type === 'salary_payout';

      // Always create a corresponding Expense so Expense Ledger, Dashboard, and Balances stay 100% in sync
      const linkedExpense: Expense = {
        id: adv.id,
        date: adv.date,
        title: `${isPayout ? 'Salary Payout' : 'Staff Advance'}: ${emp?.name || 'Staff'} (${adv.description})`,
        category: isPayout ? 'staff_payroll' : 'staff_welfare',
        amount: adv.amount,
        paymentMode: adv.paymentMode,
        paidBy: 'shop_galla',
        employeeId: adv.employeeId,
        billType: 'kaccha',
        paymentStatus: 'paid',
        isAdvance: adv.type === 'advance',
        notes: adv.description,
        createdAt: adv.date,
      };

      const newState: AppState = {
        ...state,
        employeeAdvances: [adv, ...state.employeeAdvances.filter((a) => a.id !== adv.id)],
        expenses: [linkedExpense, ...state.expenses.filter((e) => e.id !== adv.id)],
      };
      return reconcileStoreState(newState);
    }

    case 'DELETE_EMPLOYEE_ADVANCE': {
      const id = action.payload;
      const newState: AppState = {
        ...state,
        employeeAdvances: state.employeeAdvances.filter((a) => a.id !== id),
        expenses: state.expenses.filter((e) => e.id !== id),
      };
      return reconcileStoreState(newState);
    }

    case 'SETTLE_MONTHLY_SALARY': {
      const settlement = action.payload;
      const emp = state.employees.find((e) => e.id === settlement.employeeId);
      const nowIso = settlement.settledAt || new Date().toISOString();
      const currentMonth = settlement.month || getCurrentMonth();

      let newAdvances = [
        ...state.employeeAdvances.filter(
          (a) =>
            !(
              a.employeeId === settlement.employeeId &&
              a.month === currentMonth &&
              a.type === 'salary_payout'
            )
        ),
      ];

      let newExpenses = [
        ...state.expenses.filter(
          (e) =>
            !(
              e.employeeId === settlement.employeeId &&
              e.category === 'staff_payroll' &&
              isThisMonth(e.date)
            )
        ),
      ];

      if (settlement.netPaid > 0) {
        const payoutId = `settle-${settlement.employeeId}-${currentMonth}`;

        // 1. Advance passbook record
        const payoutAdvance: EmployeeAdvance = {
          id: payoutId,
          employeeId: settlement.employeeId,
          date: nowIso,
          amount: settlement.netPaid,
          type: 'salary_payout',
          description: `Salary settlement for ${getMonthLabel(currentMonth)}`,
          paymentMode: 'cash',
          month: currentMonth,
        };
        newAdvances = [payoutAdvance, ...newAdvances];

        // 2. Master expense ledger entry
        const payoutExpense: Expense = {
          id: payoutId,
          date: nowIso,
          title: `Salary Settlement: ${emp?.name || 'Staff'} (${getMonthLabel(currentMonth)})`,
          category: 'staff_payroll',
          amount: settlement.netPaid,
          paymentMode: 'cash',
          paidBy: 'shop_galla',
          employeeId: settlement.employeeId,
          billType: 'kaccha',
          paymentStatus: 'paid',
          notes: `Net salary paid after adjusting advances (${settlement.totalAdvances}) and deductions (${settlement.totalDeductions})`,
          createdAt: nowIso,
        };
        newExpenses = [payoutExpense, ...newExpenses];
      }

      const newState: AppState = {
        ...state,
        monthlySettlements: [
          settlement,
          ...state.monthlySettlements.filter(
            (s) => !(s.employeeId === settlement.employeeId && s.month === currentMonth)
          ),
        ],
        employeeAdvances: newAdvances,
        expenses: newExpenses,
      };
      return reconcileStoreState(newState);
    }

    case 'ADD_FAMILY_MEMBER': {
      return { ...state, familyMembers: [...state.familyMembers, action.payload] };
    }

    case 'UPDATE_FAMILY_MEMBER': {
      return {
        ...state,
        familyMembers: state.familyMembers.map((fm) =>
          fm.id === action.payload.id ? action.payload : fm
        ),
      };
    }

    case 'DELETE_FAMILY_MEMBER': {
      const famId = action.payload;
      const newState: AppState = {
        ...state,
        familyMembers: state.familyMembers.filter((fm) => fm.id !== famId),
        familyTransactions: state.familyTransactions.filter((ft) => ft.familyMemberId !== famId),
        expenses: state.expenses.filter((e) => e.familyMemberId !== famId),
      };
      return reconcileStoreState(newState);
    }

    case 'ADD_FAMILY_TRANSACTION': {
      const ft = action.payload;
      const fm = state.familyMembers.find((m) => m.id === ft.familyMemberId);
      let newExpenses = [...state.expenses];

      // If money leaves shop (withdrawal or reimbursement payout), sync to expenses
      if (ft.type === 'withdrawal') {
        const exp: Expense = {
          id: ft.id,
          date: ft.date,
          title: `Family Draw: ${fm?.name || 'Family'} (${ft.description})`,
          category: 'family_withdrawal',
          amount: ft.amount,
          paymentMode: 'cash',
          paidBy: 'shop_galla',
          familyMemberId: ft.familyMemberId,
          billType: 'kaccha',
          paymentStatus: 'paid',
          createdAt: ft.date,
        };
        newExpenses = [exp, ...newExpenses.filter((e) => e.id !== ft.id)];
      } else if (ft.type === 'reimburse') {
        const exp: Expense = {
          id: ft.id,
          date: ft.date,
          title: `Reimbursement Paid: ${fm?.name || 'Family'} (${ft.description})`,
          category: 'reimbursement',
          amount: ft.amount,
          paymentMode: 'cash',
          paidBy: 'shop_galla',
          familyMemberId: ft.familyMemberId,
          billType: 'kaccha',
          paymentStatus: 'paid',
          createdAt: ft.date,
        };
        newExpenses = [exp, ...newExpenses.filter((e) => e.id !== ft.id)];
      }

      const newState: AppState = {
        ...state,
        familyTransactions: [ft, ...state.familyTransactions.filter((t) => t.id !== ft.id)],
        expenses: newExpenses,
      };
      return reconcileStoreState(newState);
    }

    case 'ADD_RECURRING_BILL': {
      return { ...state, recurringBills: [...state.recurringBills, action.payload] };
    }

    case 'UPDATE_RECURRING_BILL': {
      return {
        ...state,
        recurringBills: state.recurringBills.map((rb) =>
          rb.id === action.payload.id ? action.payload : rb
        ),
      };
    }

    case 'DELETE_RECURRING_BILL': {
      return {
        ...state,
        recurringBills: state.recurringBills.filter((rb) => rb.id !== action.payload),
      };
    }

    case 'MARK_RECURRING_PAID': {
      const bill = state.recurringBills.find((rb) => rb.id === action.payload);
      if (!bill) return state;
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, bill.dueDay);

      const newState: AppState = {
        ...state,
        recurringBills: state.recurringBills.map((rb) =>
          rb.id === action.payload
            ? {
                ...rb,
                status: 'paid' as const,
                lastPaidDate: now.toISOString(),
                nextDueDate: nextMonth.toISOString(),
              }
            : rb
        ),
      };
      return reconcileStoreState(newState);
    }

    case 'TOP_UP_BALANCE': {
      const { target, amount, description } = action.payload;
      const topUpExpense: Expense = {
        id: generateId(),
        date: new Date().toISOString(),
        title:
          description ||
          `Sales / Cash Deposit to ${target === 'galla' ? 'Cash Galla' : 'Bank'}`,
        category: 'other',
        amount,
        paymentMode: 'cash',
        paidBy: 'shop_galla',
        billType: 'kaccha',
        paymentStatus: 'paid',
        isTopUp: true,
        topUpTarget: target,
        createdAt: new Date().toISOString(),
      };

      const newState: AppState = {
        ...state,
        expenses: [topUpExpense, ...state.expenses],
      };
      return reconcileStoreState(newState);
    }

    case 'IMPORT_STATE': {
      return reconcileStoreState({ ...action.payload });
    }

    case 'UPDATE_SHOP_PROFILE': {
      const newState: AppState = {
        ...state,
        shopProfile: { ...state.shopProfile, ...action.payload },
      };
      return reconcileStoreState(newState);
    }

    default:
      return state;
  }
}

// ---- Context ----
interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist state on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply dark mode class
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch } },
    children
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// ---- Derived Data Hooks ----
export function useEmployeeMonthSummary(employeeId: string, month?: string) {
  const { state } = useStore();
  const targetMonth = month || getCurrentMonth();

  const advances = state.employeeAdvances.filter(
    (a) => a.employeeId === employeeId && a.month === targetMonth
  );
  const employee = state.employees.find((e) => e.id === employeeId);
  const settlement = state.monthlySettlements.find(
    (s) => s.employeeId === employeeId && s.month === targetMonth
  );

  const totalAdvances = advances
    .filter((a) => a.type === 'advance' || a.type === 'tea_food')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalBonuses = advances
    .filter((a) => a.type === 'bonus')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = advances
    .filter((a) => a.type === 'deduction')
    .reduce((sum, a) => sum + a.amount, 0);
  const baseSalary = employee?.baseSalary || 0;
  const netPayable = Math.max(0, baseSalary + totalBonuses - totalAdvances - totalDeductions);
  const salaryPaid = advances
    .filter((a) => a.type === 'salary_payout')
    .reduce((sum, a) => sum + a.amount, 0);

  const isSettled = settlement?.isSettled || salaryPaid > 0;

  return {
    employee,
    advances,
    totalAdvances,
    totalBonuses,
    totalDeductions,
    baseSalary,
    netPayable: isSettled ? 0 : netPayable,
    salaryPaid,
    isSettled,
    settlement,
  };
}

export function useFamilyMemberSummary(memberId: string, month?: string) {
  const { state } = useStore();
  const targetMonth = month || getCurrentMonth();

  const member = state.familyMembers.find((fm) => fm.id === memberId);
  const transactions = state.familyTransactions.filter(
    (ft) => ft.familyMemberId === memberId && ft.month === targetMonth
  );

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPersonalForShop = transactions
    .filter((t) => t.type === 'personal_for_shop')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReimbursed = transactions
    .filter((t) => t.type === 'reimburse')
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetUsed = totalWithdrawn;
  const budgetRemaining = (member?.monthlyBudget || 0) - budgetUsed;
  const shopOwes = Math.max(0, totalPersonalForShop - totalReimbursed);

  return {
    member,
    transactions,
    totalWithdrawn,
    totalPersonalForShop,
    totalReimbursed,
    budgetUsed,
    budgetRemaining,
    shopOwes,
  };
}
