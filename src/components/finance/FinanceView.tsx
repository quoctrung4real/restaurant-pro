import { useMemo, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import type { AppData } from '../../data/store';
import { calculateBreakEven } from '../../algorithms/forecasting';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface FinanceViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M đ`;

export default function FinanceView({ data }: FinanceViewProps) {
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30');

  const stats = useMemo(() => {
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const filtered = data.revenues.filter(r => r.date >= startDate).sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = filtered.reduce((s, r) => s + r.amount, 0);
    const totalOrders = filtered.reduce((s, r) => s + r.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Costs
    const monthlyFixed = data.fixedCosts.reduce((s, c) => {
      if (c.frequency === 'monthly') return s + c.amount * (days / 30);
      if (c.frequency === 'yearly') return s + c.amount * (days / 365);
      if (c.frequency === 'weekly') return s + c.amount * (days / 7);
      return s;
    }, 0);

    const cogs = totalRevenue * 0.32;
    const staffCost = data.employees.filter(e => e.status === 'active')
      .reduce((s, e) => s + e.hourlyWage * 8 * 26 * (days / 30), 0);

    const totalCost = cogs + monthlyFixed + staffCost;
    const grossProfit = totalRevenue - cogs;
    const netProfit = totalRevenue - totalCost;

    return {
      filtered, totalRevenue, totalOrders, avgOrderValue,
      cogs, monthlyFixed, staffCost, totalCost,
      grossProfit, netProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0,
    };
  }, [data, period]);

  const breakevenData = useMemo(() => {
    const monthlyFixed = data.fixedCosts.reduce((s, c) => {
      if (c.frequency === 'monthly') return s + c.amount;
      if (c.frequency === 'yearly') return s + c.amount / 12;
      if (c.frequency === 'weekly') return s + c.amount * 4.33;
      return s;
    }, 0);
    const staffCost = data.employees.filter(e => e.status === 'active')
      .reduce((s, e) => s + e.hourlyWage * 8 * 26, 0);
    const totalFixed = monthlyFixed + staffCost;

    const avgPrice = data.menuItems.reduce((s, i) => s + i.price, 0) / (data.menuItems.length || 1);
    const avgCost = data.menuItems.reduce((s, i) => s + i.cost, 0) / (data.menuItems.length || 1);

    return calculateBreakEven(totalFixed, avgPrice, avgCost);
  }, [data]);

  // Trend chart
  const recentRevenues = stats.filtered.slice(-60);
  const trendChartData = {
    labels: recentRevenues.map(r => {
      const d = new Date(r.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Doanh thu',
        data: recentRevenues.map(r => r.amount),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 1,
        borderWidth: 2,
      },
      {
        label: 'Số đơn',
        data: recentRevenues.map(r => r.orderCount),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 1,
        borderWidth: 2,
      }
    ]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } } } },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, maxTicksLimit: 15 },
        border: { display: false },
      },
      y: {
        type: 'linear' as const, position: 'left' as const,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: (v: any) => `${(v/1e6).toFixed(1)}M` },
        border: { display: false },
      },
      y1: {
        type: 'linear' as const, position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: 'rgba(59,130,246,0.6)', font: { size: 10 } },
        border: { display: false },
      }
    }
  };

  // Cost breakdown bar
  const costChartData = {
    labels: ['Giá vốn (COGS)', 'Chi phí cố định', 'Nhân sự', 'Lợi nhuận'],
    datasets: [{
      data: [stats.cogs, stats.monthlyFixed, stats.staffCost, Math.max(0, stats.netProfit)],
      backgroundColor: [
        'rgba(244,63,94,0.7)', 'rgba(139,92,246,0.7)',
        'rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)'
      ],
      borderColor: ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981'],
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, callback: (v: any) => `${(v/1e6).toFixed(0)}M` }, border: { display: false } }
    }
  };

  return (
    <div className="page-content">
      {/* Period selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div className="tabs">
          {([['7', '7 ngày'], ['30', '30 ngày'], ['90', '3 tháng'], ['365', '1 năm']] as const).map(([v, l]) => (
            <button key={v} className={`tab-btn ${period === v ? 'active' : ''}`} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* P&L Summary */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '📈', label: 'Doanh thu', value: fmtM(stats.totalRevenue), color: 'green', clr: 'var(--success-text)' },
          { icon: '📦', label: 'Giá vốn (COGS)', value: fmtM(stats.cogs), color: 'rose', clr: 'var(--danger-text)' },
          { icon: '💹', label: 'Lợi nhuận gộp', value: fmtM(stats.grossProfit), color: 'cyan', clr: 'var(--accent-cyan)' },
          { icon: '👥', label: 'Chi phí nhân sự', value: fmtM(stats.staffCost), color: 'blue', clr: 'var(--info-text)' },
          { icon: '🏢', label: 'Chi phí cố định', value: fmtM(stats.monthlyFixed), color: 'violet', clr: 'var(--accent-violet)' },
          { icon: `${stats.netProfit >= 0 ? '💰' : '📉'}`, label: 'Lợi nhuận ròng', value: fmtM(stats.netProfit), color: stats.netProfit >= 0 ? 'green' : 'rose', clr: stats.netProfit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' },
        ].map((k, i) => (
          <div className={`kpi-card ${stats.netProfit < 0 && k.label === 'Lợi nhuận ròng' ? 'danger' : ''}`} key={i}>
            <div className={`kpi-icon ${k.color}`} style={{ marginBottom: 8 }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: k.clr }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Margin indicators */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>📊 Chỉ số biên lợi nhuận</h3>
        <div className="grid-3">
          {[
            { label: 'Biên lợi nhuận gộp', value: stats.grossMargin, good: 60 },
            { label: 'Biên lợi nhuận ròng', value: stats.netMargin, good: 15 },
            { label: 'Food Cost %', value: (stats.cogs / stats.totalRevenue * 100) || 0, good: 35, invert: true },
          ].map((m, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                color: m.invert ? (m.value <= m.good ? 'var(--success-text)' : 'var(--danger-text)') :
                                  (m.value >= m.good ? 'var(--success-text)' : m.value >= m.good * 0.6 ? 'var(--warning-text)' : 'var(--danger-text)') }}>
                {m.value.toFixed(1)}%
              </div>
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{
                    width: `${Math.min(100, Math.abs(m.value))}%`,
                    background: m.invert ? (m.value <= m.good ? 'var(--gradient-success)' : 'linear-gradient(90deg, #f43f5e, #fb7185)') :
                                          (m.value >= m.good ? 'var(--gradient-success)' : m.value >= m.good * 0.6 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #f43f5e, #fb7185)'),
                  }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Mục tiêu: {m.invert ? '≤' : '≥'} {m.good}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-container col-span-2">
          <div className="section-header">
            <h3 className="section-title">📈 Xu hướng doanh thu & số đơn</h3>
          </div>
          <div className="chart-wrapper" style={{ height: 260 }}>
            <Line data={trendChartData} options={trendOptions as any} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-container">
          <div className="section-header">
            <h3 className="section-title">💸 Phân bổ chi phí</h3>
          </div>
          <div className="chart-wrapper" style={{ height: 220 }}>
            <Bar data={costChartData} options={barOpts as any} />
          </div>
        </div>

        {/* Break-even Analysis */}
        <div className="chart-container">
          <div className="section-header">
            <h3 className="section-title">⚖️ Break-even Analysis</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Điểm hòa vốn / tháng', value: fmtCur(breakevenData.breakEvenRevenue), icon: '⚖️', color: 'var(--warning-text)' },
              { label: 'Số đơn cần đạt HV', value: `${breakevenData.breakEvenOrders} đơn/tháng`, icon: '🧾', color: 'var(--info-text)' },
              { label: 'Biên đóng góp', value: `${breakevenData.contributionMarginRatio}%`, icon: '💹', color: 'var(--success-text)' },
              { label: 'Doanh thu TT cần thiết', value: fmtCur(breakevenData.currentRevToCoverFixed), icon: '🎯', color: 'var(--primary-400)' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
                border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.icon} {item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed cost breakdown */}
      <div className="chart-container">
        <h3 className="section-title" style={{ marginBottom: 16 }}>🏢 Chi tiết Chi phí cố định</h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead><tr><th>Khoản chi phí</th><th>Danh mục</th><th>Tần suất</th><th>Số tiền</th><th>Quy tháng</th></tr></thead>
            <tbody>
              {data.fixedCosts.map(fc => {
                const monthly = fc.frequency === 'monthly' ? fc.amount :
                  fc.frequency === 'yearly' ? fc.amount / 12 : fc.amount * 4.33;
                return (
                  <tr key={fc.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fc.name}</td>
                    <td><span className="badge badge-neutral">{fc.category}</span></td>
                    <td><span className="badge badge-info">{fc.frequency === 'monthly' ? 'Hàng tháng' : fc.frequency === 'yearly' ? 'Hàng năm' : 'Hàng tuần'}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-text)' }}>{fmtCur(fc.amount)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmtCur(monthly)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <td colSpan={4} style={{ fontWeight: 700, padding: '12px 16px' }}>TỔNG CHI PHÍ CỐ ĐỊNH / THÁNG</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--danger-text)', padding: '12px 16px' }}>
                  {fmtCur(data.fixedCosts.reduce((s, fc) => {
                    if (fc.frequency === 'monthly') return s + fc.amount;
                    if (fc.frequency === 'yearly') return s + fc.amount / 12;
                    return s + fc.amount * 4.33;
                  }, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
