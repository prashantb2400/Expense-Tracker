// ============================================================
// Bahi-Khata Modern — App Shell (Main Layout Container)
// ============================================================
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { TabId } from '../../types';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// Lazy-load tab components for code splitting
const Dashboard = lazy(() => import('../dashboard/Dashboard'));
const ExpenseLedger = lazy(() => import('../expenses/ExpenseLedger'));
const EmployeeManager = lazy(() => import('../employees/EmployeeManager'));
const FamilyManager = lazy(() => import('../family/FamilyManager'));
const RecurringBills = lazy(() => import('../recurring/RecurringBills'));
const ReportsBackup = lazy(() => import('../reports/ReportsBackup'));

// Map tab IDs to their lazy components
const TAB_COMPONENTS: Record<TabId, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: Dashboard,
  expenses: ExpenseLedger,
  employees: EmployeeManager,
  family: FamilyManager,
  recurring: RecurringBills,
  reports: ReportsBackup,
};

// Keyboard shortcut mapping
const KEY_TAB_MAP: Record<string, TabId> = {
  d: 'dashboard',
  e: 'expenses',
  s: 'employees',
  f: 'family',
  r: 'recurring',
  b: 'reports',
};

function TabFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#0F3D3E] dark:text-[#D4AF37]" />
        <span className="text-sm text-[#8A8780] dark:text-[#6B6B70]">Loading…</span>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { state, dispatch } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleNewExpense = useCallback(() => {
    // Navigate to expenses tab and signal new expense creation
    dispatch({ type: 'SET_TAB', payload: 'expenses' });
    setShowNewExpense(true);
    // Reset after a tick so the ExpenseLedger can pick it up
    requestAnimationFrame(() => {
      setShowNewExpense(false);
    });
  }, [dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore when modifier keys are held (Ctrl, Cmd, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // N = New Expense
      if (key === 'n') {
        e.preventDefault();
        handleNewExpense();
        return;
      }

      // A = New Advance (go to employees tab)
      if (key === 'a') {
        e.preventDefault();
        dispatch({ type: 'SET_TAB', payload: 'employees' });
        return;
      }

      // Tab navigation shortcuts
      if (key in KEY_TAB_MAP) {
        e.preventDefault();
        dispatch({ type: 'SET_TAB', payload: KEY_TAB_MAP[key] });
        return;
      }

      // Escape = close sidebar on mobile
      if (key === 'escape' && sidebarOpen) {
        e.preventDefault();
        closeSidebar();
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, handleNewExpense, sidebarOpen, closeSidebar]);

  // Get the active tab component
  const ActiveTabComponent = TAB_COMPONENTS[state.activeTab];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#141518] transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area — offset by sidebar on desktop */}
      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <TopBar onMenuToggle={toggleSidebar} onNewExpense={handleNewExpense} />

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<TabFallback />}>
                <ActiveTabComponent />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer — subtle */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-[#E6E2DD] dark:border-[#2A2B30]">
          <p className="text-center text-xs text-[#8A8780] dark:text-[#6B6B70]">
            Bahi-Khata Modern • Your data stays on this device •{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-[#E6E2DD] dark:border-[#2A2B30] text-[10px] font-mono bg-[#F3EFEA] dark:bg-[#1A1B1F]">
              N
            </kbd>{' '}
            New Expense •{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-[#E6E2DD] dark:border-[#2A2B30] text-[10px] font-mono bg-[#F3EFEA] dark:bg-[#1A1B1F]">
              D
            </kbd>{' '}
            Dashboard •{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-[#E6E2DD] dark:border-[#2A2B30] text-[10px] font-mono bg-[#F3EFEA] dark:bg-[#1A1B1F]">
              E
            </kbd>{' '}
            Expenses
          </p>
        </footer>
      </div>
    </div>
  );
}
