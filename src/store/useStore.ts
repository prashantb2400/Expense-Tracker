// ============================================================
// Bahi-Khata Modern — Global State Store (Context + Reducer)
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { AppState, AppAction, Expense } from '../types';
import { createDemoState } from '../utils/seedData';
import { generateId, getCurrentMonth } from '../utils/formatters';

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

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultState, ...parsed };
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

function deductExpenseFromBalance(state: AppState, expense: Expense, reverse = false): AppState {
  const multiplier = reverse ? -1 : 1;
  const amount = expense.amount * multiplier;

  if (expense.isTopUp) {
    // Top-ups ADD to balance
    if (expense.topUpTarget === 'galla') {
      return {
        ...state,
        shopProfile: {
          ...state.shopProfile,
          gallaBalance: state.shopProfile.gallaBalance + amount,
        },
      };
    } else {
      return {
        ...state,
        shopProfile: {
          ...state.shopProfile,
          bankBalance: state.shopProfile.bankBalance + amount,
        },
      };
    }
  }

  // Normal expenses DEDUCT from balance
  if (expense.paymentMode === 'cash') {
    return {
      ...state,
      shopProfile: {
        ...state.shopProfile,
        gallaBalance: state.shopProfile.gallaBalance - amount,
      },
    };
  } else {
    return {
      ...state,
      shopProfile: {
        ...state.shopProfile,
        bankBalance: state.shopProfile.bankBalance - amount,
      },
    };
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'COMPLETE_SETUP': {
      return {
        ...state,
        isSetupComplete: true,
        shopProfile: action.payload.shopProfile,
        employees: action.payload.employees,
        familyMembers: action.payload.familyMembers,
      };
    }

    case 'LOAD_DEMO_DATA': {
      return createDemoState();
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
      const newState = {
        ...state,
        expenses: [action.payload, ...state.expenses],
      };
      // Auto-deduct from balance
      const deducted = deductExpenseFromBalance(newState, action.payload);

      // If expense is tagged to a family member as a withdrawal, deduct from their wallet
      if (action.payload.familyMemberId && action.payload.category === 'family_withdrawal') {
        return {
          ...deducted,
          familyMembers: deducted.familyMembers.map(fm =>
            fm.id === action.payload.familyMemberId
              ? { ...fm, walletBalance: fm.walletBalance - action.payload.amount }
              : fm
          ),
        };
      }

      // If expense is an employee advance, add to advances ledger
      if (action.payload.isAdvance && action.payload.employeeId) {
        const advance = {
          id: generateId(),
          employeeId: action.payload.employeeId,
          date: action.payload.date,
          amount: action.payload.amount,
          type: 'advance' as const,
          description: action.payload.title,
          paymentMode: action.payload.paymentMode,
          month: getCurrentMonth(),
        };
        return {
          ...deducted,
          employeeAdvances: [...deducted.employeeAdvances, advance],
        };
      }

      return deducted;
    }

    case 'UPDATE_EXPENSE': {
      const oldExpense = state.expenses.find(e => e.id === action.payload.id);
      let newState = {
        ...state,
        expenses: state.expenses.map(e => (e.id === action.payload.id ? action.payload : e)),
      };
      // Reverse old deduction, apply new
      if (oldExpense) {
        newState = deductExpenseFromBalance(newState, oldExpense, true);
      }
      newState = deductExpenseFromBalance(newState, action.payload);
      return newState;
    }

    case 'DELETE_EXPENSE': {
      const expense = state.expenses.find(e => e.id === action.payload);
      let newState = {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      };
      // Reverse deduction
      if (expense) {
        newState = deductExpenseFromBalance(newState, expense, true);
        // Reverse family wallet deduction
        if (expense.familyMemberId && expense.category === 'family_withdrawal') {
          newState = {
            ...newState,
            familyMembers: newState.familyMembers.map(fm =>
              fm.id === expense.familyMemberId
                ? { ...fm, walletBalance: fm.walletBalance + expense.amount }
                : fm
            ),
          };
        }
      }
      return newState;
    }

    case 'ADD_EMPLOYEE': {
      return { ...state, employees: [...state.employees, action.payload] };
    }

    case 'UPDATE_EMPLOYEE': {
      return {
        ...state,
        employees: state.employees.map(e => (e.id === action.payload.id ? action.payload : e)),
      };
    }

    case 'DELETE_EMPLOYEE': {
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload),
        employeeAdvances: state.employeeAdvances.filter(a => a.employeeId !== action.payload),
      };
    }

    case 'ADD_EMPLOYEE_ADVANCE': {
      let newState = {
        ...state,
        employeeAdvances: [...state.employeeAdvances, action.payload],
      };
      // Also deduct from galla/bank
      if (action.payload.type === 'advance' || action.payload.type === 'tea_food' || action.payload.type === 'bonus') {
        if (action.payload.paymentMode === 'cash') {
          newState = {
            ...newState,
            shopProfile: {
              ...newState.shopProfile,
              gallaBalance: newState.shopProfile.gallaBalance - action.payload.amount,
            },
          };
        } else {
          newState = {
            ...newState,
            shopProfile: {
              ...newState.shopProfile,
              bankBalance: newState.shopProfile.bankBalance - action.payload.amount,
            },
          };
        }
      }
      return newState;
    }

    case 'DELETE_EMPLOYEE_ADVANCE': {
      const adv = state.employeeAdvances.find(a => a.id === action.payload);
      let newState = {
        ...state,
        employeeAdvances: state.employeeAdvances.filter(a => a.id !== action.payload),
      };
      if (adv && (adv.type === 'advance' || adv.type === 'tea_food' || adv.type === 'bonus')) {
        if (adv.paymentMode === 'cash') {
          newState = {
            ...newState,
            shopProfile: {
              ...newState.shopProfile,
              gallaBalance: newState.shopProfile.gallaBalance + adv.amount,
            },
          };
        } else {
          newState = {
            ...newState,
            shopProfile: {
              ...newState.shopProfile,
              bankBalance: newState.shopProfile.bankBalance + adv.amount,
            },
          };
        }
      }
      return newState;
    }

    case 'SETTLE_MONTHLY_SALARY': {
      return {
        ...state,
        monthlySettlements: [...state.monthlySettlements, action.payload],
      };
    }

    case 'ADD_FAMILY_MEMBER': {
      return { ...state, familyMembers: [...state.familyMembers, action.payload] };
    }

    case 'UPDATE_FAMILY_MEMBER': {
      return {
        ...state,
        familyMembers: state.familyMembers.map(fm =>
          fm.id === action.payload.id ? action.payload : fm
        ),
      };
    }

    case 'DELETE_FAMILY_MEMBER': {
      return {
        ...state,
        familyMembers: state.familyMembers.filter(fm => fm.id !== action.payload),
        familyTransactions: state.familyTransactions.filter(ft => ft.familyMemberId !== action.payload),
      };
    }

    case 'ADD_FAMILY_TRANSACTION': {
      let newState = {
        ...state,
        familyTransactions: [...state.familyTransactions, action.payload],
      };
      // Auto-deduct from family member wallet if withdrawal
      if (action.payload.type === 'withdrawal') {
        newState = {
          ...newState,
          familyMembers: newState.familyMembers.map(fm =>
            fm.id === action.payload.familyMemberId
              ? { ...fm, walletBalance: fm.walletBalance - action.payload.amount }
              : fm
          ),
        };
      }
      return newState;
    }

    case 'ADD_RECURRING_BILL': {
      return { ...state, recurringBills: [...state.recurringBills, action.payload] };
    }

    case 'UPDATE_RECURRING_BILL': {
      return {
        ...state,
        recurringBills: state.recurringBills.map(rb =>
          rb.id === action.payload.id ? action.payload : rb
        ),
      };
    }

    case 'DELETE_RECURRING_BILL': {
      return {
        ...state,
        recurringBills: state.recurringBills.filter(rb => rb.id !== action.payload),
      };
    }

    case 'MARK_RECURRING_PAID': {
      const bill = state.recurringBills.find(rb => rb.id === action.payload);
      if (!bill) return state;
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, bill.dueDay);
      return {
        ...state,
        recurringBills: state.recurringBills.map(rb =>
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
    }

    case 'TOP_UP_BALANCE': {
      const { target, amount, description } = action.payload;
      const topUpExpense: Expense = {
        id: generateId(),
        date: new Date().toISOString(),
        title: description || `Cash/Sales Top-up to ${target === 'galla' ? 'Galla' : 'Bank'}`,
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
      return {
        ...state,
        shopProfile: {
          ...state.shopProfile,
          [target === 'galla' ? 'gallaBalance' : 'bankBalance']:
            state.shopProfile[target === 'galla' ? 'gallaBalance' : 'bankBalance'] + amount,
        },
        expenses: [topUpExpense, ...state.expenses],
      };
    }

    case 'IMPORT_STATE': {
      return { ...action.payload };
    }

    case 'UPDATE_SHOP_PROFILE': {
      return {
        ...state,
        shopProfile: { ...state.shopProfile, ...action.payload },
      };
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
    a => a.employeeId === employeeId && a.month === targetMonth
  );
  const employee = state.employees.find(e => e.id === employeeId);
  const settlement = state.monthlySettlements.find(
    s => s.employeeId === employeeId && s.month === targetMonth
  );

  const totalAdvances = advances
    .filter(a => a.type === 'advance' || a.type === 'tea_food')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalBonuses = advances
    .filter(a => a.type === 'bonus')
    .reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = advances
    .filter(a => a.type === 'deduction')
    .reduce((sum, a) => sum + a.amount, 0);
  const baseSalary = employee?.baseSalary || 0;
  const netPayable = baseSalary + totalBonuses - totalAdvances - totalDeductions;
  const salaryPaid = advances
    .filter(a => a.type === 'salary_payout')
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    employee,
    advances,
    totalAdvances,
    totalBonuses,
    totalDeductions,
    baseSalary,
    netPayable,
    salaryPaid,
    isSettled: settlement?.isSettled || false,
    settlement,
  };
}

export function useFamilyMemberSummary(memberId: string, month?: string) {
  const { state } = useStore();
  const targetMonth = month || getCurrentMonth();

  const member = state.familyMembers.find(fm => fm.id === memberId);
  const transactions = state.familyTransactions.filter(
    ft => ft.familyMemberId === memberId && ft.month === targetMonth
  );

  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPersonalForShop = transactions
    .filter(t => t.type === 'personal_for_shop')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReimbursed = transactions
    .filter(t => t.type === 'reimburse')
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetUsed = totalWithdrawn;
  const budgetRemaining = (member?.monthlyBudget || 0) - budgetUsed;
  const shopOwes = totalPersonalForShop - totalReimbursed;

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
