import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getCurrentAcademicYear } from '../utils/dateHelpers';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Spinner } from '../components/Spinner';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// ── PDF Export ────────────────────────────────────────────────────────────────

const exportToPDF = async (ref, filename, title, subtitle, meta = {}) => {
  if (!ref.current) return;
  try {
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    // ── Capture the chart area ──────────────────────────────────────────────
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc',
      logging: false,
      ignoreElements: el => el.classList?.contains('no-print'),
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297
    const margin = 14;
    const contentW = pageW - margin * 2;

    // ── Palette ─────────────────────────────────────────────────────────────
    const DARK   = [26,  11,  46];   // #1A0B2E
    const VIOLET = [99, 102, 241];   // indigo-500
    const LIGHT  = [248, 250, 252];  // slate-50
    const MUTED  = [100, 116, 139];  // slate-500
    const WHITE  = [255, 255, 255];
    const BORDER = [226, 232, 240];  // slate-200

    // ── Helper: rounded rect ─────────────────────────────────────────────────
    const roundedRect = (x, y, w, h, r, fillColor, strokeColor) => {
      if (fillColor) { pdf.setFillColor(...fillColor); pdf.roundedRect(x, y, w, h, r, r, 'F'); }
      if (strokeColor) { pdf.setDrawColor(...strokeColor); pdf.roundedRect(x, y, w, h, r, r, 'S'); }
    };

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1 — COVER
    // ════════════════════════════════════════════════════════════════════════

    // Full dark background
    pdf.setFillColor(...DARK);
    pdf.rect(0, 0, pageW, pageH, 'F');

    // Decorative violet circle top-right
    pdf.setFillColor(139, 92, 246, 0.15);
    pdf.circle(pageW + 10, -10, 80, 'F');

    // Decorative violet circle bottom-left
    pdf.setFillColor(99, 102, 241, 0.1);
    pdf.circle(-20, pageH + 20, 70, 'F');

    // School name badge
    roundedRect(margin, 40, contentW, 10, 2, [45, 27, 77]);
    pdf.setTextColor(167, 139, 250);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text((meta.schoolName || 'KNHS School Portal').toUpperCase(), pageW / 2, 46.5, { align: 'center' });

    // Report type label
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('ANALYTICS REPORT', pageW / 2, 65, { align: 'center' });

    // Main title
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(title, contentW);
    pdf.text(titleLines, pageW / 2, 82, { align: 'center' });

    // Subtitle
    pdf.setTextColor(167, 139, 250);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, pageW / 2, 82 + titleLines.length * 12 + 6, { align: 'center' });

    // Divider line
    const divY = 82 + titleLines.length * 12 + 18;
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 30, divY, pageW - margin - 30, divY);

    // Meta info cards
    const metaItems = [
      { label: 'Generated', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Time', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
      { label: 'Academic Year', value: meta.academicYear || '—' },
      { label: 'Prepared By', value: meta.preparedBy || 'School Administrator' },
    ];
    const cardW = (contentW - 9) / 4;
    metaItems.forEach((item, i) => {
      const cx = margin + i * (cardW + 3);
      const cy = divY + 10;
      roundedRect(cx, cy, cardW, 22, 2, [45, 27, 77]);
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label.toUpperCase(), cx + cardW / 2, cy + 7, { align: 'center' });
      pdf.setTextColor(...WHITE);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      const valLines = pdf.splitTextToSize(item.value, cardW - 4);
      pdf.text(valLines[0], cx + cardW / 2, cy + 15, { align: 'center' });
    });

    // Summary stats (if provided)
    if (meta.stats && meta.stats.length > 0) {
      const statsY = divY + 46;
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('KEY METRICS', pageW / 2, statsY, { align: 'center' });

      const statW = (contentW - (meta.stats.length - 1) * 4) / meta.stats.length;
      meta.stats.forEach((stat, i) => {
        const sx = margin + i * (statW + 4);
        const sy = statsY + 5;
        roundedRect(sx, sy, statW, 28, 3, [45, 27, 77]);
        // Colored top accent
        pdf.setFillColor(...(stat.color || VIOLET));
        pdf.roundedRect(sx, sy, statW, 3, 1.5, 1.5, 'F');
        pdf.setTextColor(148, 163, 184);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.label.toUpperCase(), sx + statW / 2, sy + 10, { align: 'center' });
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(stat.value), sx + statW / 2, sy + 21, { align: 'center' });
      });
    }

    // Bottom branding strip
    pdf.setFillColor(45, 27, 77);
    pdf.rect(0, pageH - 18, pageW, 18, 'F');
    pdf.setTextColor(167, 139, 250);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KNHS SCHOOL PORTAL', margin, pageH - 10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confidential — For Internal Use Only', pageW - margin, pageH - 10, { align: 'right' });
    pdf.setTextColor(148, 163, 184);
    pdf.text('Page 1', pageW / 2, pageH - 10, { align: 'center' });

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 2 — CHARTS
    // ════════════════════════════════════════════════════════════════════════
    pdf.addPage();

    // Light background
    pdf.setFillColor(...LIGHT);
    pdf.rect(0, 0, pageW, pageH, 'F');

    // Top header strip
    pdf.setFillColor(...DARK);
    pdf.rect(0, 0, pageW, 14, 'F');
    pdf.setTextColor(...WHITE);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, 9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(167, 139, 250);
    pdf.text(subtitle, pageW - margin, 9, { align: 'right' });

    // Section label
    pdf.setTextColor(...MUTED);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CHARTS & VISUALIZATIONS', margin, 22);
    pdf.setDrawColor(...VIOLET);
    pdf.setLineWidth(0.4);
    pdf.line(margin, 24, margin + 52, 24);

    // Chart image — fit to page with padding
    const chartY = 28;
    const maxChartH = pageH - chartY - 22;
    const imgW = contentW;
    const imgH = Math.min((canvas.height * imgW) / canvas.width, maxChartH);
    roundedRect(margin - 2, chartY - 2, imgW + 4, imgH + 4, 3, WHITE, BORDER);
    pdf.addImage(imgData, 'PNG', margin, chartY, imgW, imgH);

    // Footer
    pdf.setFillColor(...DARK);
    pdf.rect(0, pageH - 12, pageW, 12, 'F');
    pdf.setTextColor(167, 139, 250);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KNHS SCHOOL PORTAL', margin, pageH - 5);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confidential — For Internal Use Only', pageW - margin, pageH - 5, { align: 'right' });
    pdf.setTextColor(148, 163, 184);
    pdf.text('Page 2', pageW / 2, pageH - 5, { align: 'center' });

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 3 — INTERPRETATIONS (if provided)
    // ════════════════════════════════════════════════════════════════════════
    if (meta.interpretations && meta.interpretations.length > 0) {
      pdf.addPage();

      pdf.setFillColor(...LIGHT);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Header
      pdf.setFillColor(...DARK);
      pdf.rect(0, 0, pageW, 14, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, 9);
      pdf.setTextColor(167, 139, 250);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, pageW - margin, 9, { align: 'right' });

      // Section label
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANALYSIS & INTERPRETATION', margin, 22);
      pdf.setDrawColor(...VIOLET);
      pdf.setLineWidth(0.4);
      pdf.line(margin, 24, margin + 60, 24);

      let curY = 30;
      const typeConfig = {
        good:  { bg: [240, 253, 244], border: [187, 247, 208], icon: '✓', iconColor: [22, 163, 74]  },
        warn:  { bg: [255, 251, 235], border: [253, 230, 138], icon: '!', iconColor: [217, 119, 6]  },
        bad:   { bg: [254, 242, 242], border: [254, 202, 202], icon: '✕', iconColor: [220, 38,  38] },
        info:  { bg: [239, 246, 255], border: [191, 219, 254], icon: 'i', iconColor: [37,  99, 235] },
      };

      meta.interpretations.forEach((item) => {
        const cfg = typeConfig[item.type] || typeConfig.info;
        const textLines = pdf.splitTextToSize(item.text, contentW - 18);
        const cardH = Math.max(12, textLines.length * 4.5 + 7);

        if (curY + cardH > pageH - 18) {
          // New page if overflow
          pdf.addPage();
          pdf.setFillColor(...LIGHT);
          pdf.rect(0, 0, pageW, pageH, 'F');
          pdf.setFillColor(...DARK);
          pdf.rect(0, 0, pageW, 14, 'F');
          pdf.setTextColor(...WHITE);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text(title, margin, 9);
          curY = 20;
        }

        // Card background
        pdf.setFillColor(...cfg.bg);
        pdf.setDrawColor(...cfg.border);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, curY, contentW, cardH, 2, 2, 'FD');

        // Icon circle
        pdf.setFillColor(...cfg.iconColor);
        pdf.circle(margin + 6, curY + cardH / 2, 3, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(cfg.icon, margin + 6, curY + cardH / 2 + 2, { align: 'center' });

        // Text
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(textLines, margin + 13, curY + 5.5);

        curY += cardH + 3;
      });

      // Footer
      pdf.setFillColor(...DARK);
      pdf.rect(0, pageH - 12, pageW, 12, 'F');
      pdf.setTextColor(167, 139, 250);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KNHS SCHOOL PORTAL', margin, pageH - 5);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Confidential — For Internal Use Only', pageW - margin, pageH - 5, { align: 'right' });
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, pageW / 2, pageH - 5, { align: 'center' });
    }

    pdf.save(filename);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. Please try again.');
  }
};

// ── Interpretation Helpers ────────────────────────────────────────────────────

const InterpretationPanel = ({ items }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 space-y-2">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      Interpretation
    </p>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${item.type === 'good' ? 'bg-emerald-50 border-emerald-100' : item.type === 'warn' ? 'bg-amber-50 border-amber-100' : item.type === 'bad' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
          <span className="text-sm flex-shrink-0 mt-0.5">
            {item.type === 'good' ? '✅' : item.type === 'warn' ? '⚠️' : item.type === 'bad' ? '🔴' : 'ℹ️'}
          </span>
          <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{item.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const interpretSystemData = (data) => {
  if (!data) return [];
  const items = [];
  const rate = data.dashboard?.today_rate || 0;
  const avg = data.dashboard?.average_grade || 0;
  const pending = data.dashboard?.pending_approvals || 0;
  const active = data.dashboard?.active_users || 0;

  if (rate >= 90) items.push({ type: 'good', text: `Excellent attendance today at ${rate}%. Students are highly engaged.` });
  else if (rate >= 75) items.push({ type: 'warn', text: `Attendance today is ${rate}%. Acceptable but below the 90% target. Monitor absenteeism trends.` });
  else if (rate > 0) items.push({ type: 'bad', text: `Low attendance today at ${rate}%. Immediate follow-up with advisers is recommended.` });

  if (avg >= 85) items.push({ type: 'good', text: `School average grade of ${avg}% is Very Satisfactory. Academic performance is strong.` });
  else if (avg >= 75) items.push({ type: 'warn', text: `School average grade of ${avg}% meets the passing threshold but has room for improvement.` });
  else if (avg > 0) items.push({ type: 'bad', text: `School average grade of ${avg}% is below 75%. Intervention programs may be needed.` });

  if (pending > 0) items.push({ type: 'warn', text: `${pending} account${pending > 1 ? 's are' : ' is'} pending approval. Review and approve to allow access.` });
  else items.push({ type: 'good', text: 'All account registrations have been reviewed. No pending approvals.' });

  if (active > 0) items.push({ type: 'info', text: `${active} user${active > 1 ? 's are' : ' is'} currently active in the portal.` });

  return items;
};

const interpretGradeData = (gradeData, filterLevel, filterSubject, filterQuarter) => {
  if (!gradeData || gradeData.total_students === 0) return [];
  const items = [];
  const avg = gradeData.overall_average || 0;
  const cats = gradeData.category_counts || [];
  const outstanding = cats.find(c => c.name.includes('Outstanding'))?.value || 0;
  const dnm = cats.find(c => c.name.includes('Did Not'))?.value || 0;
  const total = gradeData.total_students || 1;
  const outPct = Math.round((outstanding / total) * 100);
  const dnmPct = Math.round((dnm / total) * 100);

  const scope = filterLevel !== 'all' ? filterLevel : 'all grade levels';
  const qLabel = filterQuarter !== 'all' ? `Q${filterQuarter}` : 'all quarters';

  if (avg >= 90) items.push({ type: 'good', text: `Outstanding average of ${avg}% across ${scope} for ${qLabel}. Students are performing excellently.` });
  else if (avg >= 85) items.push({ type: 'good', text: `Very Satisfactory average of ${avg}% for ${scope}. Performance is above expectations.` });
  else if (avg >= 75) items.push({ type: 'warn', text: `Average of ${avg}% for ${scope} meets the passing standard. Consider targeted support for struggling students.` });
  else if (avg > 0) items.push({ type: 'bad', text: `Average of ${avg}% for ${scope} is below the passing threshold of 75%. Immediate academic intervention is recommended.` });

  if (outPct >= 30) items.push({ type: 'good', text: `${outPct}% of students are in the Outstanding category — a strong indicator of effective teaching.` });
  if (dnmPct > 20) items.push({ type: 'bad', text: `${dnmPct}% of students (${dnm}) did not meet expectations. Remedial programs should be prioritized.` });
  else if (dnmPct > 0) items.push({ type: 'warn', text: `${dnmPct}% of students (${dnm}) did not meet expectations. Monitor these students closely.` });
  else items.push({ type: 'good', text: 'All students are meeting the minimum passing standard of 75%.' });

  const byLevel = gradeData.by_level || [];
  if (byLevel.length > 1) {
    const sorted = [...byLevel].sort((a, b) => b.average - a.average);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top && bottom && top.label !== bottom.label) {
      items.push({ type: 'info', text: `${top.label} leads with ${top.average}% average. ${bottom.label} has the lowest at ${bottom.average}% — consider allocating more resources there.` });
    }
  }

  return items;
};

const interpretAttendanceData = (analytics) => {
  if (!analytics) return [];
  const items = [];
  const pie = analytics.pie_data || [];
  const total = pie.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [{ type: 'info', text: 'No attendance records found for this period.' }];

  const present = pie.find(d => d.name === 'Present')?.value || 0;
  const absent = pie.find(d => d.name === 'Absent')?.value || 0;
  const late = pie.find(d => d.name === 'Late')?.value || 0;
  const excused = pie.find(d => d.name === 'Excused')?.value || 0;
  const presentRate = Math.round(((present + late + excused) / total) * 100);
  const absentRate = Math.round((absent / total) * 100);

  if (presentRate >= 95) items.push({ type: 'good', text: `Excellent overall attendance rate of ${presentRate}%. Students are consistently present.` });
  else if (presentRate >= 85) items.push({ type: 'good', text: `Good attendance rate of ${presentRate}%. Minor absences are within acceptable range.` });
  else if (presentRate >= 75) items.push({ type: 'warn', text: `Attendance rate of ${presentRate}% is at the minimum threshold. Investigate recurring absences.` });
  else items.push({ type: 'bad', text: `Low attendance rate of ${presentRate}%. Significant absenteeism detected — parent/guardian communication is advised.` });

  if (absentRate > 15) items.push({ type: 'bad', text: `${absentRate}% absence rate (${absent} records) is high. Consider home visitation or counseling programs.` });
  if (late > 0) {
    const latePct = Math.round((late / total) * 100);
    if (latePct > 10) items.push({ type: 'warn', text: `${latePct}% of records are marked Late (${late} instances). Review school arrival policies.` });
  }

  const rankings = analytics.section_rankings || [];
  if (rankings.length > 0) {
    const top = rankings[0];
    const bottom = rankings[rankings.length - 1];
    if (top.total_records > 0) items.push({ type: 'good', text: `Top section: ${top.name} with ${top.rate}% attendance rate.` });
    if (bottom.total_records > 0 && bottom.rate < 75) items.push({ type: 'bad', text: `${bottom.name} has the lowest attendance at ${bottom.rate}%. Needs immediate attention.` });
  }

  return items;
};

// ── Export Button ─────────────────────────────────────────────────────────────

const ExportButton = ({ onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:border-violet-300 hover:text-violet-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
  >
    {loading ? (
      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin" />
    ) : (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )}
    Export PDF
  </button>
);

// --- Sub-components (Moved to top to avoid ReferenceErrors) ---

const renderCustomBarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 6} fill="#64748b" textAnchor="middle" className="text-[8px] font-black">
    {value}%
  </text>
);

const renderHorizontalBarLabel = ({ x, y, width, height, value }) => (
  <text x={x + width + 5} y={y + height / 2} fill="#64748b" dominantBaseline="central" className="text-[8px] font-black">
    {value}%
  </text>
);

const EmptyState = ({ message, submessage }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-sm w-full">
    <svg className="w-16 h-16 mx-auto mb-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">{message}</p>
    {submessage && <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">{submessage}</p>}
  </div>
);

const StatChip = ({ label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    purple: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colors[color]} flex flex-col items-center min-w-[80px]`}>
      <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{label}</span>
      <span className="text-sm font-black leading-none">{value}</span>
    </div>
  );
};

const MiniCard = ({ title, value, icon, alert }) => (
  <div className={`bg-white border ${alert ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} rounded-xl p-5 shadow-sm flex items-center gap-5 min-h-[90px]`}>
    <div className={`p-3 rounded-lg ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'} flex items-center justify-center`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg></div>
    <div className="flex flex-col justify-center"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h4><p className={`text-2xl font-black tracking-tight leading-none ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value || 0}</p></div>
  </div>
);

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xs font-black text-white flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{payload[0].value}{unit}<span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span></p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-xs font-black text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />{payload[0].value}<span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span></p>
      </div>
    );
  }
  return null;
};

const AttendanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <div className="space-y-1">{payload.map((entry, index) => (<div key={index} className="flex items-center justify-between gap-4"><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} /><span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span></div><span className="text-[10px] font-black text-white">{entry.value}</span></div>))}</div>
      </div>
    );
  }
  return null;
};

const AttendanceTrendsSection = ({ data }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[400px] w-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Presence Trends</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">30-Day Activity Monitor</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Present</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Late</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Excused</span></div>
        </div>
        <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[7px] font-black text-emerald-600 uppercase tracking-widest">Live</div>
      </div>
    </div>
    <div className="flex-1">
      {!data || data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No trend activity detected</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
              <linearGradient id="colorExcused" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(str) => {
              if (!str) return '';
              const d = new Date(str);
              return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }} />
            <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <Tooltip content={<AttendanceTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1}} />
            <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
            <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late" />
            <Area type="monotone" dataKey="excused" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorExcused)" name="Excused" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const AttendanceStatusPieSection = ({ data }) => {
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0;
  const pieColors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const hasData = data && data.some(d => d.value > 0);
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[400px] w-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Presence Distribution</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Overall Status Summary</p>
      </div>
      <div className="flex-1 flex items-center gap-4">
        {!hasData ? (
          <div className="w-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center">No status distribution records</div>
        ) : (
          <>
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={6} dataKey="value">
                    {data?.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-black text-slate-900 leading-none">{total}</p>
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Records</p>
              </div>
            </div>
            <div className="w-1/2 flex flex-col justify-center space-y-3">
              {data?.map((item, index) => {
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter leading-none">{item.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-black text-slate-900 leading-none">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AttendanceByLevelBarSection = ({ data }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[400px] w-full flex flex-col">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Level Engagement</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Attendance Rate by Grade Level</p>
    </div>
    <div className="flex-1">
      {!data || data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No level-wise data available</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="level" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <Bar dataKey="rate" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={32} label={renderCustomBarLabel}>
              {data?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.rate >= 90 ? '#10b981' : entry.rate >= 75 ? '#3b82f6' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const AttendanceRankingsSection = ({ rankings, period }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col h-[400px] w-full">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rankings — {period}</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Section Performance Index</p>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
      {!rankings || rankings.length === 0 ? (
        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center py-10">No rankings established for this period</div>
      ) : (
        rankings?.map((rank, idx) => (
          <div key={rank.id} className="group flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all">
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 flex items-center justify-center rounded-md font-black text-[9px] ${rank.total_records > 0 ? (idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400') : 'bg-slate-50 text-slate-300'}`}>
                {idx + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none mb-1">{rank.name}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {rank.total_records > 0 ? `${rank.total_records} records` : 'No attendance yet'}
                </span>
              </div>
            </div>
            <div className="text-right">
              {rank.total_records > 0 ? (
                <>
                  <div className={`text-xs font-black leading-none mb-1 ${rank.rate >= 90 ? 'text-emerald-600' : rank.rate >= 75 ? 'text-blue-600' : 'text-rose-600'}`}>{rank.rate}%</div>
                  <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${rank.rate >= 90 ? 'bg-emerald-500' : rank.rate >= 75 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${rank.rate}%` }} /></div>
                </>
              ) : (
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">N/A</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const SubjectPerformanceSection = ({ data }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[350px] w-full">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Benchmarking</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Subject Performance Index</p>
      </div>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
      </div>
    </div>
    <div className="h-72">
      {!data || data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No subject metrics tracked</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} 
              axisLine={false} 
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <Bar dataKey="avg_grade" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} label={renderCustomBarLabel} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const TrafficIntelligenceSection = ({ data }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[350px] w-full">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Traffic Intelligence</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">24H Active Engagement</p>
    </div>
    <div className="h-72">
      {!data || data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No traffic logs detected</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="stepAfter" dataKey="users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const GradeDistributionPieSection = ({ data, total, label }) => {
  const totalSum = data.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[350px] w-full">
      <div className="mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Achievement Spread</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Performance Tier Distribution</p>
      </div>
      <div className="h-64 flex items-center gap-4">
        {/* Left Side: Chart */}
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={6} dataKey="value">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-black text-slate-900 leading-none">{total}</p>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        </div>

        {/* Right Side: Legends & Highlighted Percentages */}
        <div className="w-1/2 flex flex-col justify-center space-y-3">
          {data.map((item, index) => {
            const percentage = totalSum > 0 ? ((item.value / totalSum) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter truncate leading-none" title={item.name}>
                    {item.name.split(' (')[0]}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-black text-slate-900 leading-none">{percentage}%</span>
                  <span className="text-[7px] font-bold text-slate-400 leading-none">({item.value})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const GradeDistributionBarSection = ({ data, filterLevel }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[350px] w-full">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cross-Group Comparison</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Performance Index by {filterLevel === 'all' ? 'Grade Level' : 'Classroom'}</p>
      </div>
      <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /></div>
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ bottom: 30 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} angle={-25} textAnchor="end" padding={{ left: 20, right: 20 }} />
          <YAxis domain={[70, 100]} tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <Bar dataKey="average" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={data.length === 1 ? 60 : 32} label={renderCustomBarLabel}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.average >= 90 ? '#10b981' : entry.average >= 75 ? '#6366f1' : '#ef4444'} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GradeRankingSection = ({ data, filterSubject, meta, timeframe }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-h-[350px] w-full">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Competitive Ranking — {timeframe === 'all' ? 'Annual' : timeframe === 'today' ? 'Today' : 'Weekly'}</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
          {filterSubject === 'all' ? 'Top 10 Performing Subjects' : `Top 10 Classrooms — ${meta.subjects.find(s => String(s.id) === String(filterSubject))?.name || ''}`}
        </p>
      </div>
      <div className="px-2 py-1 bg-slate-900 rounded text-[8px] font-black text-white uppercase tracking-[0.2em]">Efficiency Leaderboard</div>
    </div>
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 60 }}>
          <CartesianGrid strokeDasharray="2 2" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="code" width={80} tick={{fontSize: 8, fontWeight: 900, fill: '#475569'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <Bar dataKey="average" fill="#4f46e5" radius={[0, 2, 2, 0]} barSize={20} label={renderHorizontalBarLabel}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill="#4f46e5" opacity={1 - (index * 0.05)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="relative min-w-[140px]">
    <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
    <select value={value} onChange={onChange} className="w-full h-[38px] px-3 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
  </div>
);

const SubjectFilterSelect = ({ value, onChange, filterLevel, gradeData }) => {
  const meta = gradeData?.meta || { subjects: [] };
  const subjectsByLevel = meta.subjects.reduce((acc, s) => {
    const level = s.grade_level || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(s);
    return acc;
  }, {});

  return (
    <div className="relative min-w-[140px]">
      <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Subject Focus</label>
      <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50" disabled={filterLevel === 'all'}>
        <option value="all">{filterLevel === 'all' ? 'Select Level First' : 'Cumulative (All Subjects)'}</option>
        {filterLevel !== 'all' && Object.keys(subjectsByLevel).filter(level => level === filterLevel).map(level => (
          <optgroup key={level} label={level}>{subjectsByLevel[level].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
    </div>
  );
};

const YearSelector = ({ academicYear, onYearChange }) => (
  <div className="relative min-w-[140px]">
    <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Academic Year</label>
    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden h-[38px] group/selector">
      <button 
        type="button"
        onClick={() => onYearChange('prev')} 
        className="px-2 h-full hover:bg-slate-700 text-slate-400 border-r border-slate-700 transition-all active:scale-95 active:bg-slate-900 flex items-center justify-center group-hover/selector:text-white"
      >
        <svg className="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div className="flex-1 px-3 text-[10px] font-black text-white uppercase tracking-widest text-center select-none tabular-nums">
        {academicYear}
      </div>
      <button 
        type="button"
        onClick={() => onYearChange('next')} 
        className="px-2 h-full hover:bg-slate-700 text-slate-400 border-l border-slate-700 transition-all active:scale-95 active:bg-slate-900 flex items-center justify-center group-hover/selector:text-white"
      >
        <svg className="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  </div>
);

// --- Main Component ---

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // PDF export refs — one per tab
  const systemRef = useRef(null);
  const gradesRef = useRef(null);
  const attendanceRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (ref, tab) => {
    setExporting(true);
    const now = new Date();
    const titles = {
      system:     ['System Overview',        `Academic Year ${academicYear}`],
      grades:     ['Academic Performance',   `${academicYear} · ${filterLevel !== 'all' ? filterLevel : 'All Levels'} · ${filterQuarter !== 'all' ? 'Q' + filterQuarter : 'All Quarters'}`],
      attendance: ['Attendance Dynamics',    `${academicYear} · ${attendanceTimeframe === 'all' ? 'All-Time' : attendanceTimeframe === 'today' ? 'Today' : 'Past 7 Days'}`],
    };
    const [title, subtitle] = titles[tab] || ['Analytics Report', academicYear];

    // Build stats chips per tab
    const statsMap = {
      system: data ? [
        { label: 'Total Students', value: data.dashboard?.total_students ?? '—', color: [59, 130, 246] },
        { label: 'Total Faculty',  value: data.dashboard?.total_teachers ?? '—', color: [16, 185, 129] },
        { label: 'Avg Grade',      value: data.dashboard?.average_grade ? `${data.dashboard.average_grade}%` : '—', color: [139, 92, 246] },
        { label: "Today's Rate",   value: `${data.dashboard?.today_rate ?? 0}%`, color: [245, 158, 11] },
        { label: 'Active Users',   value: data.dashboard?.active_users ?? '—', color: [99, 102, 241] },
      ] : [],
      grades: gradeData ? [
        { label: 'Avg Score',   value: `${gradeData.overall_average ?? 0}%`, color: [99, 102, 241] },
        { label: 'Students',    value: gradeData.total_students ?? 0,         color: [16, 185, 129] },
        { label: 'Grade Entries', value: gradeData.total_entries ?? 0,        color: [59, 130, 246] },
      ] : [],
      attendance: attendanceAnalytics ? [
        { label: 'Present',  value: attendanceAnalytics.pie_data?.find(d => d.name === 'Present')?.value ?? 0,  color: [16, 185, 129] },
        { label: 'Absent',   value: attendanceAnalytics.pie_data?.find(d => d.name === 'Absent')?.value ?? 0,   color: [239, 68, 68] },
        { label: 'Late',     value: attendanceAnalytics.pie_data?.find(d => d.name === 'Late')?.value ?? 0,     color: [245, 158, 11] },
        { label: 'Excused',  value: attendanceAnalytics.pie_data?.find(d => d.name === 'Excused')?.value ?? 0,  color: [99, 102, 241] },
      ] : [],
    };

    // Build interpretations per tab
    const interpMap = {
      system:     interpretSystemData(data),
      grades:     interpretGradeData(gradeData, filterLevel, filterSubject, filterQuarter),
      attendance: interpretAttendanceData(attendanceAnalytics),
    };

    const meta = {
      schoolName:      'Kiwalan National High School',
      academicYear,
      preparedBy:      'School Administrator',
      stats:           statsMap[tab] || [],
      interpretations: interpMap[tab] || [],
    };

    await exportToPDF(ref, `knhs-${tab}-analytics-${academicYear}.pdf`, title, subtitle, meta);
    setExporting(false);
  };
  
  // Grade specific filters
  const [gradeData, setGradeData] = useState(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(localStorage.getItem('knhs_academic_year') || getCurrentAcademicYear());
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [distributionMode, setDistributionMode] = useState('student'); // 'student' or 'entry'
  const [gradeTimeframe, setGradeTimeframe] = useState('all'); // 'all', 'today', 'weekly'

  // Attendance specific data
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceTimeframe, setAttendanceTimeframe] = useState('all'); // 'all', 'today', 'weekly'

  useEffect(() => {
    if (activeTab === 'system') fetchAnalytics();
  }, [activeTab, academicYear]);

  useEffect(() => {
    if (activeTab === 'grades') fetchGradeStats();
  }, [activeTab, academicYear, filterLevel, filterSubject, filterQuarter, distributionMode, gradeTimeframe]);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendanceAnalytics();
  }, [activeTab, academicYear, attendanceTimeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setData(null); // Clear stale data
    try {
      const res = await api.get(`/admin/stats/?academic_year=${academicYear}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchGradeStats = async () => {
    setGradeLoading(true);
    setGradeData(null); // Clear stale data
    try {
      const res = await api.get(`/admin/grade-distribution/?academic_year=${academicYear}&grade_level=${filterLevel}&subject_id=${filterSubject}&quarter=${filterQuarter}&mode=${distributionMode}&timeframe=${gradeTimeframe}`);
      setGradeData(res.data);
    } catch (err) { console.error(err); }
    finally { setGradeLoading(false); }
  };

  const fetchAttendanceAnalytics = async () => {
    setAttendanceLoading(true);
    setAttendanceAnalytics(null); // Clear stale data
    try {
      const res = await api.get(`/attendance/summary/?timeframe=${attendanceTimeframe}&academic_year=${academicYear}`);
      setAttendanceAnalytics(res.data);
    } catch (err) { 
      console.error(err); 
    }
    finally { setAttendanceLoading(false); }
  };

  const handleLevelChange = (level) => {
    setFilterLevel(level);
    if (level === 'all') return;
    const meta = gradeData?.meta || { subjects: [] };
    const levelSubjects = meta.subjects.filter(s => s.grade_level === level);
    const isSubjectInLevel = levelSubjects.some(s => String(s.id) === String(filterSubject));
    if (!isSubjectInLevel) setFilterSubject('all');
  };

  const handleYearChange = (dir) => {
    const [start, end] = academicYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setAcademicYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);

    // Reset all dependent filters so stale data from the previous year is cleared
    setFilterLevel('all');
    setFilterSubject('all');
    setFilterQuarter('all');
    setGradeTimeframe('all');
    setAttendanceTimeframe('all');
    // Clear existing data immediately so charts don't show old year's data while loading
    setData(null);
    setGradeData(null);
    setAttendanceAnalytics(null);
  };

  const tabs = [
    { id: 'system', label: 'System Overview', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'grades', label: 'Academic Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'attendance', label: 'Attendance Dynamics', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  const hasAttendanceData = attendanceAnalytics && (
    (attendanceAnalytics.daily_trends?.length > 0) ||
    (attendanceAnalytics.section_rankings?.length > 0) ||
    (attendanceAnalytics.pie_data?.some(d => d.value > 0)) ||
    (attendanceAnalytics.grade_trends?.length > 0)
  );

  return (
    <div className="space-y-4 pb-8 animate-fade-in max-w-full overflow-hidden">
      {/* Tab Navigation + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
        <ExportButton
          loading={exporting}
          onClick={() => {
            const refMap = { system: systemRef, grades: gradesRef, attendance: attendanceRef };
            handleExport(refMap[activeTab], activeTab);
          }}
        />
      </div>

      {activeTab === 'system' && (
        <div className="space-y-4 animate-fade-in" ref={systemRef}>
          {!data && loading ? <Spinner /> : (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">System Intelligence</h1>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    Live Portal Performance Metrics
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <StatChip label="Users" value={data?.dashboard?.active_users || 0} color="emerald" />
                  <StatChip label="Avg Grade" value={`${data?.dashboard?.average_grade?.toFixed(1) || 0}%`} color="purple" />
                  <StatChip label="Attendance" value={`${data?.dashboard?.today_rate || 0}%`} color="blue" />
                  <div className="ml-2">
                    <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MiniCard title="Total Students" value={data?.dashboard?.total_students} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <MiniCard title="Total Faculty" value={data?.dashboard?.total_teachers} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                <MiniCard title="Active Classes" value={data?.dashboard?.total_classes} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                <MiniCard title="Pending Tasks" value={data?.dashboard?.pending_approvals} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" alert={data?.dashboard?.pending_approvals > 0} />
              </div>

              {!data ? (
                <EmptyState message="Failed to load systems engine" submessage="Check server connection and permissions" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-12">
                    <AttendanceTrendsSection data={data?.attendance?.daily_trends} />
                  </div>
                  <div className="lg:col-span-7">
                    <SubjectPerformanceSection data={data?.grades?.subject_stats} />
                  </div>
                  <div className="lg:col-span-5">
                    <TrafficIntelligenceSection data={data?.dashboard?.charts?.active_users_trends} />
                  </div>
                  <div className="lg:col-span-12">
                    <InterpretationPanel items={interpretSystemData(data)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-4 animate-fade-in" ref={gradesRef}>
          {gradeLoading && !gradeData ? <Spinner /> : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-slate-900 py-8 px-6 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">Academic Intelligence</h1>
                  <p className="text-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    Performance Distribution Matrix — {academicYear}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-8">
                    <FilterSelect 
                      label="Grade Level" 
                      value={filterLevel} 
                      onChange={e => handleLevelChange(e.target.value)}
                      options={[{ value: 'all', label: 'Global (All Levels)' }, ...(gradeData?.meta?.grade_levels || []).map(l => ({ value: l, label: l }))]}
                    />
                    <SubjectFilterSelect 
                      value={filterSubject} 
                      onChange={e => setFilterSubject(e.target.value)}
                      filterLevel={filterLevel}
                      gradeData={gradeData}
                    />
                    <FilterSelect 
                      label="View Mode" 
                      value={distributionMode} 
                      onChange={e => setDistributionMode(e.target.value)}
                      options={[
                        { value: 'student', label: 'General Average' },
                        { value: 'entry', label: 'Cumulative Grades' }
                      ]}
                    />
                    <FilterSelect 
                      label="Quarter Focus" 
                      value={filterQuarter} 
                      onChange={e => setFilterQuarter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Annual Aggregate' },
                        { value: '1', label: 'Q1 — 1st Quarter' },
                        { value: '2', label: 'Q2 — 2nd Quarter' },
                        { value: '3', label: 'Q3 — 3rd Quarter' },
                        { value: '4', label: 'Q4 — 4th Quarter' }
                      ]}
                    />
                    <FilterSelect 
                      label="Data Period" 
                      value={gradeTimeframe} 
                      onChange={e => setGradeTimeframe(e.target.value)}
                      options={[
                        { value: 'all', label: 'All Records' },
                        { value: 'today', label: 'Today Only' },
                        { value: 'weekly', label: 'This Week' }
                      ]}
                    />
                    <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatChip label="Avg Score" value={`${gradeData?.overall_average || 0}%`} color="indigo" />
                  <StatChip label="Graded" value={gradeData?.total_students || 0} color="emerald" />
                  <StatChip label="Records" value={gradeData?.total_entries || 0} color="blue" />
                </div>
              </div>

              {!gradeData || gradeData.total_students === 0 ? (
                <EmptyState message="No Data Mapped" submessage="Adjust filters to synthesize academic performance data" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-4">
                    <GradeDistributionPieSection
                      data={gradeData.category_counts}
                      total={distributionMode === 'student' ? gradeData.total_students : gradeData.total_entries}
                      label={distributionMode === 'student' ? 'Students' : 'Entries'}
                    />
                  </div>
                  <div className="lg:col-span-8">
                    <GradeDistributionBarSection data={gradeData.by_level} filterLevel={filterLevel} />
                  </div>
                  <div className="lg:col-span-12">
                    <GradeRankingSection data={gradeData.by_group} filterSubject={filterSubject} meta={gradeData.meta} timeframe={gradeTimeframe} />
                  </div>
                  <div className="lg:col-span-12">
                    <InterpretationPanel items={interpretGradeData(gradeData, filterLevel, filterSubject, filterQuarter)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fade-in" ref={attendanceRef}>
          {attendanceLoading && !attendanceAnalytics ? <Spinner /> : (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">Attendance Dynamics</h1>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    Student Presence & Engagement Analytics — {academicYear}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FilterSelect 
                    label="Analysis Period" 
                    value={attendanceTimeframe} 
                    onChange={e => setAttendanceTimeframe(e.target.value)}
                    options={[
                      { value: 'all', label: 'All-Time Aggregate' },
                      { value: 'today', label: 'Today Only' },
                      { value: 'weekly', label: 'Past 7 Days' }
                    ]}
                  />
                  <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
                </div>
              </div>

              {!hasAttendanceData ? (
                <EmptyState 
                  message="No Attendance Recorded" 
                  submessage={attendanceTimeframe === 'all' ? "Start encoding attendance in the Attendance module to see live analytics" : `No records found for the "${attendanceTimeframe.toUpperCase()}" period. Try switching to "All-Time Aggregate"`} 
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8">
                    <AttendanceTrendsSection data={attendanceAnalytics.daily_trends} />
                  </div>
                  <div className="lg:col-span-4">
                    <AttendanceStatusPieSection data={attendanceAnalytics.pie_data} />
                  </div>
                  <div className="lg:col-span-4">
                    <AttendanceRankingsSection rankings={attendanceAnalytics.section_rankings} period={attendanceAnalytics.period} />
                  </div>
                  <div className="lg:col-span-8">
                    <AttendanceByLevelBarSection data={attendanceAnalytics.grade_trends} />
                  </div>
                  <div className="lg:col-span-12">
                    <InterpretationPanel items={interpretAttendanceData(attendanceAnalytics)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
