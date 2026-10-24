// ============================================================
// Bahi-Khata Modern — Complete Type Definitions
// ============================================================

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';
export type BillType = 'pakka' | 'kaccha';
export type PaymentStatus = 'paid' | 'pending' | 'partially_paid';
export type PaidBy = 'shop_galla' | 'owner_personal' | 'family_member';

export type ExpenseCategory =
  | 'inventory_stock'
  | 'staff_payroll'
  | 'staff_welfare'
  | 'shop_utilities'
  | 'logistics_hamali'
  | 'petty_cash'
  | 'maintenance'
  | 'marketing'
  | 'vendor_payment'
  | 'family_withdrawal'
  | 'reimbursement'
  | 'other';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  inventory_stock: 'Inventory / Stock',
  staff_payroll: 'Staff Payroll',
  staff_welfare: 'Staff Welfare (Tea, Food)',
  shop_utilities: 'Shop Utilities',
  logistics_hamali: 'Logistics / Hamali',
  petty_cash: 'Daily Petty Cash',
  maintenance: 'Maintenance & Repairs',
  marketing: 'Marketing & Ads',
  vendor_payment: 'Vendor / Supplier Payment',
  family_withdrawal: 'Family Withdrawal',
  reimbursement: 'Reimbursement',
  other: 'Other / Misc',
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash (Galla)',
  upi: 'UPI (GPay/PhonePe/Paytm)',
  bank_transfer: 'Bank Transfer (NEFT/IMPS)',
  cheque: 'Cheque',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending / Credit',
  partially_paid: 'Partially Paid',
};

export interface Expense {
  id: string;
  date: string; // ISO string
  title: string;
  description?: string;
  category: ExpenseCategory;
  subCategory?: string;
  amount: number;
  paymentMode: PaymentMode;
  paidBy: PaidBy;
  familyMemberId?: string;
  employeeId?: string;
  vendorName?: string;
  billType: BillType;
  gstAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  referenceId?: string; // UTR / Bill No
  isAdvance?: boolean;
  isTopUp?: boolean;
  topUpTarget?: 'galla' | 'bank';
  createdAt: string;
}

export type EmployeeRole = 'salesman' | 'helper' | 'cashier' | 'manager' | 'delivery' | 'other';
export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  salesman: 'Salesman',
  helper: 'Shop Helper',
  cashier: 'Billing / Cashier',
  manager: 'Manager',
  delivery: 'Delivery & Stock',
  other: 'Other',
};

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  joiningDate: string;
  baseSalary: number;
  phone?: string;
  status: EmployeeStatus;
  salaryCycleDay: number; // 1-31
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  type: 'advance' | 'tea_food' | 'bonus' | 'deduction' | 'salary_payout';
  description: string;
  paymentMode: PaymentMode;
  month: string; // YYYY-MM format
}

export interface MonthlySettlement {
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  totalAdvances: number;
  totalBonuses: number;
  totalDeductions: number;
  netPaid: number;
  settledAt: string;
  isSettled: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  monthlyBudget: number;
  walletBalance: number;
  phone?: string;
}

export interface FamilyTransaction {
  id: string;
  familyMemberId: string;
  date: string;
  amount: number;
  type: 'withdrawal' | 'personal_for_shop' | 'reimburse';
  description: string;
  expenseId?: string;
  month: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  dueDay: number;
  vendorName?: string;
  status: 'paid' | 'due_soon' | 'overdue' | 'upcoming';
  lastPaidDate?: string;
  nextDueDate: string;
  notes?: string;
}

export interface ShopProfile {
  shopName: string;
  gallaBalance: number;
  bankBalance: number;
  openingGallaBalance: number;
  openingBankBalance: number;
}

export interface AppState {
  isSetupComplete: boolean;
  shopProfile: ShopProfile;
  expenses: Expense[];
  employees: Employee[];
  employeeAdvances: EmployeeAdvance[];
  monthlySettlements: MonthlySettlement[];
  familyMembers: FamilyMember[];
  familyTransactions: FamilyTransaction[];
  recurringBills: RecurringBill[];
  darkMode: boolean;
  activeTab: TabId;
}

export type TabId =
  | 'dashboard'
  | 'expenses'
  | 'employees'
  | 'family'
  | 'recurring'
  | 'reports';

export const TAB_LABELS: Record<TabId, string> = {
  dashboard: 'Dashboard',
  expenses: 'Expense Ledger',
  employees: 'Staff & Payroll',
  family: 'Family Members',
  recurring: 'Recurring Bills',
  reports: 'Reports & Backup',
};

// Action types for the store reducer
export type AppAction =
  | { type: 'COMPLETE_SETUP'; payload: { shopProfile: ShopProfile; employees: Employee[]; familyMembers: FamilyMember[] } }
  | { type: 'LOAD_DEMO_DATA' }
  | { type: 'RESET_APP' }
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_EMPLOYEE_ADVANCE'; payload: EmployeeAdvance }
  | { type: 'DELETE_EMPLOYEE_ADVANCE'; payload: string }
  | { type: 'SETTLE_MONTHLY_SALARY'; payload: MonthlySettlement }
  | { type: 'ADD_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'UPDATE_FAMILY_MEMBER'; payload: FamilyMember }
  | { type: 'DELETE_FAMILY_MEMBER'; payload: string }
  | { type: 'ADD_FAMILY_TRANSACTION'; payload: FamilyTransaction }
  | { type: 'ADD_RECURRING_BILL'; payload: RecurringBill }
  | { type: 'UPDATE_RECURRING_BILL'; payload: RecurringBill }
  | { type: 'DELETE_RECURRING_BILL'; payload: string }
  | { type: 'MARK_RECURRING_PAID'; payload: string }
  | { type: 'TOP_UP_BALANCE'; payload: { target: 'galla' | 'bank'; amount: number; description: string } }
  | { type: 'IMPORT_STATE'; payload: AppState }
  | { type: 'UPDATE_SHOP_PROFILE'; payload: Partial<ShopProfile> };
