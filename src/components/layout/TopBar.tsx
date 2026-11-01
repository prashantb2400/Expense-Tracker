// ============================================================
// Bahi-Khata Modern — Top Bar (Mobile)
// ============================================================
import { motion } from 'framer-motion';
import { Menu, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TAB_LABELS } from '../../types';
import { formatINRCompact } from '../../utils/formatters';

interface TopBarProps {
  onMenuToggle: () => void;
  onNewExpense: () => void;
}

export default function TopBar({ onMenuToggle, onNewExpense }: TopBarProps) {
  const { state } = useStore();

  return (
    <header className="lg:hidden sticky top-0 z-20 bg-white/80 dark:bg-[#141518]/80 backdrop-blur-xl border-b border-[#E5E0D6] dark:border-[#292C34]">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="flex-shrink-0 p-2 -ml-2 rounded-xl text-[#73716A] dark:text-[#949188] hover:text-[#18191C] dark:hover:text-[#F5F4EE] hover:bg-[#EFECE5] dark:hover:bg-[#292C34] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <motion.h2
            key={state.activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="font-serif text-lg font-semibold text-[#18191C] dark:text-[#F5F4EE] truncate"
          >
            {TAB_LABELS[state.activeTab]}
          </motion.h2>
        </div>

        {/* Right: balances + new expense */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mini balance display */}
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#164032]/5 dark:bg-[#D4AF37]/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#73716A] dark:text-[#949188]">
                Galla
              </span>
              <span className="text-xs font-bold font-mono text-[#164032] dark:text-[#D4AF37] tabular-nums">
                {formatINRCompact(state.shopProfile.gallaBalance)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB]/5 dark:bg-[#60A5FA]/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#73716A] dark:text-[#949188]">
                Bank
              </span>
              <span className="text-xs font-bold font-mono text-[#2563EB] dark:text-[#60A5FA] tabular-nums">
                {formatINRCompact(state.shopProfile.bankBalance)}
              </span>
            </div>
          </div>

          {/* New Expense Quick Action */}
          <button
            onClick={onNewExpense}
            className="btn-tactile relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold
              bg-[#164032] dark:bg-[#D4AF37] text-white dark:text-[#141518]
              hover:bg-[#0E2B22] dark:hover:bg-[#C59B27]
              transition-all duration-150 shadow-xs"
            aria-label="New Expense"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">New</span>
            {/* Keyboard shortcut badge */}
            <kbd className="hidden md:inline-flex items-center justify-center ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 dark:bg-black/20">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* Mobile balance bar — shown below on small screens */}
      <div className="sm:hidden flex items-center justify-center gap-3 px-4 pb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#164032]/5 dark:bg-[#D4AF37]/10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#73716A] dark:text-[#949188]">
            Galla
          </span>
          <span className="text-xs font-bold font-mono text-[#164032] dark:text-[#D4AF37] tabular-nums">
            {formatINRCompact(state.shopProfile.gallaBalance)}
          </span>
        </div>
        <div className="w-px h-4 bg-[#E5E0D6] dark:bg-[#292C34]" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB]/5 dark:bg-[#60A5FA]/10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#73716A] dark:text-[#949188]">
            Bank
          </span>
          <span className="text-xs font-bold font-mono text-[#2563EB] dark:text-[#60A5FA] tabular-nums">
            {formatINRCompact(state.shopProfile.bankBalance)}
          </span>
        </div>
      </div>
    </header>
  );
}
