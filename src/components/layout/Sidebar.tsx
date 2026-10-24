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
      <div className="px-5 pt-6 pb-4 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0F3D3E] dark:bg-[#D4AF37] flex items-center justify-center shadow-sm">
              <Store size={20} className="text-white dark:text-[#1A1B1F]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-semibold text-[#1A1B1F] dark:text-[#F5F5F0] truncate leading-tight">
                {state.shopProfile.shopName || 'Bahi Khata'}
              </h1>
              <p className="text-xs text-[#8A8780] dark:text-[#6B6B70] mt-0.5">
                Digital Ledger
              </p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden flex-shrink-0 p-1.5 rounded-lg text-[#8A8780] hover:text-[#1A1B1F] hover:bg-[#F3EFEA] dark:text-[#6B6B70] dark:hover:text-[#F5F5F0] dark:hover:bg-[#2A2B30] transition-colors"
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
                    ? 'text-[#0F3D3E] dark:text-[#D4AF37]'
                    : 'text-[#5C5A56] dark:text-[#9B9BA0] hover:text-[#1A1B1F] dark:hover:text-[#F5F5F0] hover:bg-[#F3EFEA] dark:hover:bg-[#2A2B30]'
                }
              `}
            >
              {/* Active background indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-[#0F3D3E]/10 dark:bg-[#D4AF37]/10"
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0F3D3E] dark:bg-[#D4AF37]"
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
                    ? 'text-[#0F3D3E] dark:text-[#D4AF37]'
                    : 'text-[#8A8780] dark:text-[#6B6B70] group-hover:text-[#5C5A56] dark:group-hover:text-[#9B9BA0]'
                }`}
              />
              <span className="relative z-10 truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="px-3 pb-4 space-y-2 border-t border-[#E6E2DD] dark:border-[#2A2B30] pt-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-[#5C5A56] dark:text-[#9B9BA0]
            hover:text-[#1A1B1F] dark:hover:text-[#F5F5F0]
            hover:bg-[#F3EFEA] dark:hover:bg-[#2A2B30]
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
              <Moon size={20} className="text-[#8A8780]" />
            )}
          </motion.div>
          <span>{state.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-[#C94A4A]/70 hover:text-[#C94A4A]
            hover:bg-[#C94A4A]/5 dark:hover:bg-[#C94A4A]/10
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
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#1A1B1F] border-r border-[#E6E2DD] dark:border-[#2A2B30] z-30">
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
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#1A1B1F] border-r border-[#E6E2DD] dark:border-[#2A2B30] z-50 lg:hidden shadow-2xl"
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
