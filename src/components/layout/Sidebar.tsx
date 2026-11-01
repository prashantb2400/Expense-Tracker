// ============================================================
// Bahi-Khata Modern — Sidebar Navigation
// ============================================================
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  LayoutDashboard,
  Receipt,
  Users,
  Heart,
  CalendarClock,
  FileBarChart,
  Moon,
  Sun,
  RotateCcw,
  X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { TabId } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expense Ledger', icon: Receipt },
  { id: 'employees', label: 'Staff & Payroll', icon: Users },
  { id: 'family', label: 'Family Members', icon: Heart },
  { id: 'recurring', label: 'Recurring Bills', icon: CalendarClock },
  { id: 'reports', label: 'Reports & Backup', icon: FileBarChart },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { state, dispatch } = useStore();

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      dispatch({ type: 'SET_TAB', payload: tabId });
      onClose();
    },
    [dispatch, onClose]
  );

  const handleToggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, [dispatch]);

  const handleReset = useCallback(() => {
    if (window.confirm('This will erase ALL data and re-run the setup wizard. Are you sure?')) {
      dispatch({ type: 'RESET_APP' });
    }
  }, [dispatch]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Shop Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[#E5E0D6] dark:border-[#292C34]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#164032] dark:bg-[#D4AF37] flex items-center justify-center shadow-xs">
              <Store size={20} className="text-white dark:text-[#141518]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-semibold text-[#18191C] dark:text-[#F5F4EE] truncate leading-tight">
                {state.shopProfile.shopName || 'Bahi Khata'}
              </h1>
              <p className="text-xs text-[#73716A] dark:text-[#949188] mt-0.5">
                Digital Ledger
              </p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden flex-shrink-0 p-1.5 rounded-lg text-[#73716A] hover:text-[#18191C] hover:bg-[#EFECE5] dark:text-[#949188] dark:hover:text-[#F5F4EE] dark:hover:bg-[#292C34] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = state.activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`
                relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-150 ease-out group
                ${
                  isActive
                    ? 'text-[#164032] dark:text-[#D4AF37]'
                    : 'text-[#5C5A56] dark:text-[#9B9BA0] hover:text-[#18191C] dark:hover:text-[#F5F4EE] hover:bg-[#EFECE5] dark:hover:bg-[#22252B]'
                }
              `}
            >
              {/* Active background indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-[#164032]/10 dark:bg-[#D4AF37]/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Active left accent bar */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#164032] dark:bg-[#D4AF37]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <Icon
                size={20}
                className={`relative z-10 flex-shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#164032] dark:text-[#D4AF37]'
                    : 'text-[#73716A] dark:text-[#949188] group-hover:text-[#5C5A56] dark:group-hover:text-[#9B9BA0]'
                }`}
              />
              <span className="relative z-10 truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 pb-4 space-y-2 border-t border-[#E5E0D6] dark:border-[#292C34] pt-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-[#5C5A56] dark:text-[#9B9BA0]
            hover:text-[#18191C] dark:hover:text-[#F5F4EE]
            hover:bg-[#EFECE5] dark:hover:bg-[#22252B]
            transition-colors duration-150"
        >
          <motion.div
            key={state.darkMode ? 'moon' : 'sun'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {state.darkMode ? (
              <Sun size={20} className="text-[#D4AF37]" />
            ) : (
              <Moon size={20} className="text-[#73716A]" />
            )}
          </motion.div>
          <span>{state.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-[#B93E3E]/70 hover:text-[#B93E3E]
            hover:bg-[#B93E3E]/5 dark:hover:bg-[#B93E3E]/10
            transition-colors duration-150"
        >
          <RotateCcw size={18} />
          <span>Reset / Re-run Setup</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar — always visible */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#1C1E23] border-r border-[#E5E0D6] dark:border-[#292C34] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            {/* Sliding sidebar */}
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#1C1E23] border-r border-[#E5E0D6] dark:border-[#292C34] z-50 lg:hidden shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
