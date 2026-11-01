// ============================================================
// Bahi-Khata Modern — Reports, Print Ledger & Data Backup/Restore
// ============================================================
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart,
  Printer,
  Download,
  Upload,
  AlertOctagon,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AppState } from '../../types';
import { CATEGORY_LABELS, PAYMENT_MODE_LABELS, PAYMENT_STATUS_LABELS } from '../../types';
import {
  formatINR,
  formatDate,
  downloadJSON,
  downloadCSV,
  getCurrentMonth,
  getMonthLabel,
} from '../../utils/formatters';

export default function ReportsBackup() {
  const { state, dispatch } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available months from expenses
  const months = Array.from(
    new Set(
      state.expenses.map((e) => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  if (!months.includes(getCurrentMonth())) {
    months.unshift(getCurrentMonth());
  }

  // Filtered expenses for print/summary
  const monthExpenses = state.expenses.filter((e) => {
    const d = new Date(e.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === selectedMonth && !e.isTopUp;
  });

  const totalOutflow = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cashOutflow = monthExpenses
    .filter((e) => e.paymentMode === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const digitalOutflow = monthExpenses
    .filter((e) => e.paymentMode !== 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  // Month staff advances
  const monthAdvances = state.employeeAdvances.filter((a) => a.month === selectedMonth);
  const totalStaffAdvances = monthAdvances.reduce((sum, a) => sum + a.amount, 0);

  // Month family withdrawals
  const monthFamilyDraws = state.familyTransactions.filter(
    (ft) => ft.month === selectedMonth && ft.type === 'withdrawal'
  );
  const totalFamilyDraws = monthFamilyDraws.reduce((sum, ft) => sum + ft.amount, 0);

  // CSV Exports
  const handleExportExpensesCSV = () => {
    const headers = [
      'Date',
      'Title',
      'Category',
      'Amount (INR)',
      'Payment Mode',
      'Bill Type',
      'GST Amount',
      'Status',
      'Vendor / Party',
      'Reference / Notes',
    ];

    const rows = state.expenses.map((e) => [
      formatDate(e.date),
      e.title,
      CATEGORY_LABELS[e.category] || e.category,
      String(e.amount),
      PAYMENT_MODE_LABELS[e.paymentMode] || e.paymentMode,
      e.billType === 'pakka' ? 'Pakka (GST)' : 'Kaccha (Slip)',
      String(e.gstAmount || 0),
      PAYMENT_STATUS_LABELS[e.paymentStatus] || e.paymentStatus,
      e.vendorName || '',
      e.notes || e.referenceId || '',
    ]);

    downloadCSV(
      [headers, ...rows],
      `Bahi-Khata-Expenses-${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const handleExportStaffCSV = () => {
    const headers = ['Employee Name', 'Role', 'Date', 'Type', 'Amount (INR)', 'Payment Mode', 'Description', 'Month'];
    const rows = state.employeeAdvances.map((adv) => {
      const emp = state.employees.find((e) => e.id === adv.employeeId);
      return [
        emp?.name || 'Unknown',
        emp?.role || '',
        formatDate(adv.date),
        adv.type,
        String(adv.amount),
        adv.paymentMode,
        adv.description,
        adv.month,
      ];
    });

    downloadCSV(
      [headers, ...rows],
      `Bahi-Khata-Staff-Ledger-${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const handleExportJSON = () => {
    downloadJSON(
      state,
      `Bahi-Khata-Backup-${state.shopProfile.shopName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as AppState;
        if (!json.shopProfile || !Array.isArray(json.expenses)) {
          throw new Error('Invalid Bahi-Khata backup file format.');
        }
        dispatch({ type: 'IMPORT_STATE', payload: json });
        setImportStatus({
          type: 'success',
          message: `Backup restored successfully! Loaded ${json.expenses.length} expenses, ${json.employees?.length || 0} employees.`,
        });
      } catch (err: unknown) {
        setImportStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to parse JSON backup file.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'CRITICAL WARNING: This will permanently wipe all shop transactions, staff records, and family balances. Make sure you have exported a JSON backup first.\n\nAre you sure you want to proceed?'
      )
    ) {
      dispatch({ type: 'RESET_APP' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header - No Print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DD] dark:border-[#2A2B30]">
        <div>
          <h1 className="text-3xl font-serif text-[#1a1a1a] dark:text-[#f3efe9]">
            Reports, CA Ledger & Backup
          </h1>
          <p className="text-sm text-[#8A8780] dark:text-[#9A9892] mt-1">
            Print-ready monthly statements for Chartered Accountants, CSV exports & JSON backups
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D3E] dark:bg-[#1B4332] text-white hover:bg-[#0A2A2B] dark:hover:bg-[#143226] font-semibold text-sm shadow-sm transition-all"
        >
          <Printer size={16} />
          <span>Print Monthly Sheet</span>
        </button>
      </div>

      {/* Export & Data Management Bento - No Print */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CSV Exports */}
        <div className="bg-white dark:bg-[#1A1B1F] p-6 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0F3D3E]/10 dark:bg-[#D4AF37]/20 text-[#0F3D3E] dark:text-[#D4AF37] flex items-center justify-center mb-3">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
              Excel / CSV Exports
            </h3>
            <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1 mb-4">
              Export granular tabular data to open in Microsoft Excel, Google Sheets, or Tally.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportExpensesCSV}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] text-[#1a1a1a] dark:text-[#f3efe9] hover:bg-[#FAF8F5] dark:hover:bg-[#222328] flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={14} />
              <span>Export All Expenses (.csv)</span>
            </button>
            <button
              onClick={handleExportStaffCSV}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] text-[#1a1a1a] dark:text-[#f3efe9] hover:bg-[#FAF8F5] dark:hover:bg-[#222328] flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={14} />
              <span>Export Staff Ledger (.csv)</span>
            </button>
          </div>
        </div>

        {/* JSON Backup & Restore */}
        <div className="bg-white dark:bg-[#1A1B1F] p-6 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileJson size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
              Full JSON Cloud / Local State
            </h3>
            <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1 mb-4">
              Complete snapshot including employees, advances, recurring bills, family limits, and expenses.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportJSON}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[#2D6A4F] text-white hover:bg-[#24543E] flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download size={14} />
              <span>Download Full State Backup</span>
            </button>

            <label className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-dashed border-[#E6E2DD] dark:border-[#2A2B30] text-[#8A8780] hover:text-[#1a1a1a] dark:hover:text-[#f3efe9] hover:bg-[#FAF8F5] dark:hover:bg-[#222328] flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload size={14} />
              <span>Restore from Backup File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone & Reset */}
        <div className="bg-white dark:bg-[#1A1B1F] p-6 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#C94A4A]/10 text-[#C94A4A] flex items-center justify-center mb-3">
              <AlertOctagon size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#C94A4A]">Danger Zone / Factory Reset</h3>
            <p className="text-xs text-[#8A8780] dark:text-[#9A9892] mt-1 mb-4">
              Clear all localStorage state and re-trigger the first-time setup onboarding wizard.
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[#C94A4A]/10 text-[#C94A4A] hover:bg-[#C94A4A] hover:text-white border border-[#C94A4A]/30 transition-all"
          >
            Reset All Data & Re-run Setup
          </button>
        </div>
      </div>

      {/* Notification Toast for Import */}
      {importStatus.type && (
        <div
          className={`no-print p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            importStatus.type === 'success'
              ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-emerald-400 border border-[#2D6A4F]/20'
              : 'bg-[#C94A4A]/10 text-[#C94A4A] border border-[#C94A4A]/20'
          }`}
        >
          {importStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Month Selector Ribbon - No Print */}
      <div className="no-print flex items-center justify-between bg-white dark:bg-[#1A1B1F] p-4 rounded-2xl border border-[#E6E2DD] dark:border-[#2A2B30] shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#0F3D3E] dark:text-[#D4AF37]" />
          <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#f3efe9]">
            Select Ledger Month:
          </span>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3.5 py-1.5 rounded-xl border border-[#E6E2DD] dark:border-[#2A2B30] bg-[#FAF8F5] dark:bg-[#222328] text-sm font-semibold text-[#1a1a1a] dark:text-[#f3efe9] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {getMonthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================================ */}
      {/* PRINT-OPTIMIZED MONTHLY LEDGER SHEET */}
      {/* ============================================================ */}
      <div className="bg-white p-8 rounded-2xl border border-[#E6E2DD] shadow-md text-black print:p-0 print:border-none print:shadow-none">
        {/* Print Header */}
        <div className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-serif font-black tracking-tight uppercase">
              {state.shopProfile.shopName || 'Bahi-Khata Family Shop'}
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Monthly Operational Expense & Staff Ledger — Statement for Chartered Accountant
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-serif font-bold uppercase">{getMonthLabel(selectedMonth)}</p>
            <p className="text-xs text-gray-500">
              Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Top Summary Bento for Print */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-gray-300 p-3 rounded-lg">
            <p className="text-[11px] font-bold text-gray-600 uppercase">Total Shop Outflow</p>
            <p className="text-xl font-bold font-serif mt-1 tabular-nums">
              {formatINR(totalOutflow)}
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded-lg">
            <p className="text-[11px] font-bold text-gray-600 uppercase">Cash Galla Drawn</p>
            <p className="text-xl font-bold font-serif mt-1 tabular-nums">
              {formatINR(cashOutflow)}
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded-lg">
            <p className="text-[11px] font-bold text-gray-600 uppercase">Digital (UPI/Bank)</p>
            <p className="text-xl font-bold font-serif mt-1 tabular-nums">
              {formatINR(digitalOutflow)}
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded-lg">
            <p className="text-[11px] font-bold text-gray-600 uppercase">Staff Advances / Upaad</p>
            <p className="text-xl font-bold font-serif mt-1 tabular-nums">
              {formatINR(totalStaffAdvances)}
            </p>
          </div>
        </div>

        {/* Primary Expense Ledger Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1 mb-3">
            Shop Operations & Supplier Expenses ({monthExpenses.length} Records)
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-400 bg-gray-100">
                <th className="py-2 px-2 font-bold">Date</th>
                <th className="py-2 px-2 font-bold">Particulars / Vendor</th>
                <th className="py-2 px-2 font-bold">Category</th>
                <th className="py-2 px-2 font-bold">Mode</th>
                <th className="py-2 px-2 font-bold">Bill Type</th>
                <th className="py-2 px-2 font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {monthExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 italic">
                    No expense records found for this month.
                  </td>
                </tr>
              ) : (
                monthExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-600 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-2 px-2 font-medium">
                      <div>{exp.title}</div>
                      {exp.vendorName && (
                        <span className="text-[10px] text-gray-500">{exp.vendorName}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {CATEGORY_LABELS[exp.category] || exp.category}
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {PAYMENT_MODE_LABELS[exp.paymentMode] || exp.paymentMode}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          exp.billType === 'pakka'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.billType === 'pakka' ? 'GST Invoice' : 'Kaccha Slip'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums">
                      {formatINR(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold">
                <td colSpan={5} className="py-2.5 px-2 text-right uppercase">
                  Sub-Total Operational Expenses:
                </td>
                <td className="py-2.5 px-2 text-right text-sm tabular-nums">
                  {formatINR(totalOutflow)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Staff Payroll & Advances Sheet */}
        <div className="mb-8 print-break">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1 mb-3">
            Employee Payroll Accrual & Mid-Month Advances (Upaad)
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-400 bg-gray-100">
                <th className="py-2 px-2 font-bold">Employee Name</th>
                <th className="py-2 px-2 font-bold">Designation</th>
                <th className="py-2 px-2 font-bold text-right">Base Salary</th>
                <th className="py-2 px-2 font-bold text-right">Advances Taken</th>
                <th className="py-2 px-2 font-bold text-right">Net Payable Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {state.employees.map((emp) => {
                const advs = state.employeeAdvances.filter(
                  (a) => a.employeeId === emp.id && a.month === selectedMonth
                );
                const advTotal = advs.reduce((sum, a) => sum + a.amount, 0);
                const net = emp.baseSalary - advTotal;

                return (
                  <tr key={emp.id}>
                    <td className="py-2 px-2 font-bold">{emp.name}</td>
                    <td className="py-2 px-2 text-gray-600 capitalize">{emp.role}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{formatINR(emp.baseSalary)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-red-700">
                      {formatINR(advTotal)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums">
                      {formatINR(Math.max(0, net))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Family Member Personal Drawings */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-1 mb-3">
            Family Member Personal Drawings & Allowances
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-400 bg-gray-100">
                <th className="py-2 px-2 font-bold">Family Member</th>
                <th className="py-2 px-2 font-bold">Relation</th>
                <th className="py-2 px-2 font-bold text-right">Monthly Limit</th>
                <th className="py-2 px-2 font-bold text-right">Total Withdrawn</th>
                <th className="py-2 px-2 font-bold text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {state.familyMembers.map((fm) => {
                const draws = state.familyTransactions.filter(
                  (t) => t.familyMemberId === fm.id && t.month === selectedMonth && t.type === 'withdrawal'
                );
                const drawn = draws.reduce((sum, t) => sum + t.amount, 0);
                const rem = fm.monthlyBudget - drawn;

                return (
                  <tr key={fm.id}>
                    <td className="py-2 px-2 font-bold">{fm.name}</td>
                    <td className="py-2 px-2 text-gray-600">{fm.relation}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{formatINR(fm.monthlyBudget)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-red-700">
                      {formatINR(drawn)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums">
                      {formatINR(rem)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="mt-12 pt-6 border-t border-gray-400 flex items-center justify-between text-xs text-gray-600">
          <div>
            <p className="font-bold">Prepared By: Shop Accountant / Owner</p>
            <p className="mt-8 border-t border-gray-400 pt-1">Authorized Signature</p>
          </div>
          <div>
            <p className="font-bold">Reviewed By: Chartered Accountant</p>
            <p className="mt-8 border-t border-gray-400 pt-1">CA Seal & Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
