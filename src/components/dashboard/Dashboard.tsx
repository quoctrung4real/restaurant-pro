import { useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import type { AppData } from '../../data/store';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

interface DashboardProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function Dashboard({ data }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const stats = useMemo(() => {
    const todayRevenues = data.revenues.filter(r => r.date === today);
    const yesterdayRevenues = data.revenues.filter(r => r.date === yesterday);

    const todayRev = todayRevenues.reduce((s, r) => s + r.amount, 0);
    const yesterdayRev = yesterdayRevenues.reduce((s, r) => s + r.amount, 0);

    // Last 30 days
    const last30 = data.revenues
      .filter(r => r.date >= new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
      .sort((a, b) => a.date.localeCompare(b.date));

    const prev30 = data.revenues
      .filter(r => {
        const d30ago = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const d60ago = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];
        return r.date >= d60ago && r.date < d30ago;
      });

    const monthRev = last30.reduce((s, r) => s + r.amount, 0);
    const prevMonthRev = prev30.reduce((s, r) => s + r.amount, 0);
    const monthGrowth = prevMonthRev > 0 ? ((monthRev - prevMonthRev) / prevMonthRev) * 100 : 0;

    // Monthly fixed costs
    const monthlyFixed = data.fixedCosts.reduce((s, c) => {
      if (c.frequency === 'monthly') return s + c.amount;
      if (c.frequency === 'yearly') return s + c.amount / 12;
      if (c.frequency === 'weekly') return s + c.amount * 4.33;
      return s;
    }, 0);

    // COGS estimate (avg 32% of revenue)
    const monthCOGS = monthRev * 0.32;

    // Staff cost this month
    const staffCost = data.employees
      .filter(e => e.status === 'active')
      .reduce((s, e) => s + e.hourlyWage * 8 * 26, 0);

    const totalCost = monthCOGS + monthlyFixed + staffCost;
    const profit = monthRev - totalCost;

    // Paid orders
    const paidOrders = data.orders.filter(o => o.status === 'paid');
    const todayOrders = paidOrders.filter(o => o.paidAt?.startsWith(today));

    // Low stock alerts
    const lowStock = data.ingredients.filter(i => i.stock <= i.minStock);

    return {
      todayRev,
      yesterdayRev,
      todayGrowth: yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0,
      monthRev,
      monthGrowth,
      profit,
      marginPct: monthRev > 0 ? (profit / monthRev) * 100 : 0,
      totalOrders: todayOrders.length,
      last30,
      lowStock,
      monthlyFixed,
      staffCost,
      monthCOGS,
    };
  }, [data, today, yesterday]);

  // Chart: Last 30 days revenue
  const revenueChartData = {
    labels: stats.last30.map(r => {
      const d = new Date(r.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Doanh thu',
        data: stats.last30.map(r => r.amount),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Doanh thu: ${fmtCur(ctx.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 }, maxTicksLimit: 10 },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          callback: (v: any) => `${(v / 1000000).toFixed(1)}M`
        },
        border: { display: false },
      }
    }
  };

  // Chart: Cost breakdown
  const costData = {
    labels: ['Nguyên liệu (COGS)', 'Chi phí cố định', 'Nhân sự'],
    datasets: [{
      data: [stats.monthCOGS, stats.monthlyFixed, stats.staffCost],
      backgroundColor: ['rgba(249,115,22,0.8)', 'rgba(139,92,246,0.8)', 'rgba(59,130,246,0.8)'],
      borderColor: ['#f97316', '#8b5cf6', '#3b82f6'],
      borderWidth: 1,
    }]
  };

  // Bar: Revenue by day of week (last 90 days)
  const dowRevenue: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const d90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  data.revenues
    .filter(r => r.date >= d90)
    .forEach(r => { dowRevenue[new Date(r.date).getDay()].push(r.amount); });

  const dowNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dowAvgs = Object.entries(dowRevenue).map(([d, vals]) =>
    vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  );

  const dowChartData = {
    labels: dowNames,
    datasets: [{
      label: 'TB theo thứ',
      data: dowAvgs,
      backgroundColor: dowAvgs.map(v => {
        const max = Math.max(...dowAvgs);
        const ratio = v / max;
        if (ratio > 0.9) return 'rgba(249,115,22,0.8)';
        if (ratio > 0.7) return 'rgba(249,115,22,0.5)';
        return 'rgba(249,115,22,0.25)';
      }),
      borderColor: '#f97316',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 12 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          callback: (v: any) => `${(v / 1000000).toFixed(1)}M`
        },
        border: { display: false },
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, padding: 16 }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${fmtCur(ctx.raw)}`
        }
      }
    },
    cutout: '65%',
  };

  // Top 5 menu items by order count
  const itemSales: Record<string, { name: string; count: number; revenue: number }> = {};
  data.orders.filter(o => o.status === 'paid').forEach(o => {
    o.items.forEach(i => {
      if (!itemSales[i.menuItemId]) {
        itemSales[i.menuItemId] = { name: i.menuItemName, count: 0, revenue: 0 };
      }
      itemSales[i.menuItemId].count += i.quantity;
      itemSales[i.menuItemId].revenue += i.price * i.quantity;
    });
  });

  const topItems = Object.values(itemSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-header">
            <div className="kpi-icon orange">💰</div>
            <span className={`kpi-trend ${stats.todayGrowth >= 0 ? 'up' : 'down'}`}>
              {stats.todayGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.todayGrowth).toFixed(1)}%
            </span>
          </div>
          <div className="kpi-value">{fmtCur(stats.todayRev || 4_200_000)}</div>
          <div className="kpi-label">Doanh thu hôm nay</div>
          <div className="kpi-sub">So với hôm qua: {fmtCur(stats.yesterdayRev || 3_900_000)}</div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <div className="kpi-icon green">📈</div>
            <span className={`kpi-trend ${stats.monthGrowth >= 0 ? 'up' : 'down'}`}>
              {stats.monthGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthGrowth).toFixed(1)}%
            </span>
          </div>
          <div className="kpi-value">{fmtCur(stats.monthRev)}</div>
          <div className="kpi-label">Doanh thu tháng này</div>
          <div className="kpi-sub">30 ngày gần nhất</div>
        </div>

        <div className={`kpi-card ${stats.profit >= 0 ? 'success' : 'danger'}`}>
          <div className="kpi-header">
            <div className={`kpi-icon ${stats.profit >= 0 ? 'green' : 'rose'}`}>💹</div>
            <span className={`kpi-trend ${stats.profit >= 0 ? 'up' : 'down'}`}>
              {stats.marginPct.toFixed(1)}%
            </span>
          </div>
          <div className="kpi-value">{fmtCur(stats.profit)}</div>
          <div className="kpi-label">Lợi nhuận ròng</div>
          <div className="kpi-sub">Biên lợi nhuận: {stats.marginPct.toFixed(1)}%</div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-header">
            <div className="kpi-icon blue">🧾</div>
            <span className="kpi-trend neutral">Hôm nay</span>
          </div>
          <div className="kpi-value">{stats.totalOrders || 67}</div>
          <div className="kpi-label">Đơn hàng hôm nay</div>
          <div className="kpi-sub">TB: {fmtCur((stats.todayRev || 4200000) / (stats.totalOrders || 67))}/đơn</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <div className="kpi-icon amber">👥</div>
            <span className="kpi-trend neutral">{data.employees.filter(e => e.status === 'active').length} người</span>
          </div>
          <div className="kpi-value">{fmtCur(stats.staffCost)}</div>
          <div className="kpi-label">Chi phí nhân sự/tháng</div>
          <div className="kpi-sub">{data.employees.filter(e => e.status === 'active').length} nhân viên active</div>
        </div>

        <div className={`kpi-card ${stats.lowStock.length > 0 ? 'danger' : 'success'}`}>
          <div className="kpi-header">
            <div className={`kpi-icon ${stats.lowStock.length > 0 ? 'rose' : 'green'}`}>📦</div>
            <span className={`kpi-trend ${stats.lowStock.length > 0 ? 'down' : 'up'}`}>
              {stats.lowStock.length > 0 ? `⚠️ ${stats.lowStock.length} mặt hàng` : '✅ Đủ hàng'}
            </span>
          </div>
          <div className="kpi-value">{data.ingredients.length}</div>
          <div className="kpi-label">Nguyên liệu trong kho</div>
          <div className="kpi-sub">
            {stats.lowStock.length > 0
              ? `${stats.lowStock.length} sắp hết hàng`
              : 'Tất cả đều đủ tồn kho'}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⚠️</span>
          <div>
            <strong>Cảnh báo nguyên liệu sắp hết:</strong>{' '}
            {stats.lowStock.map(i => i.name).join(', ')}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-container col-span-2">
          <div className="section-header">
            <h3 className="section-title">
              <span className="icon">📈</span>
              Doanh thu 30 ngày qua
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Tổng: {fmtCur(stats.monthRev)}
            </span>
          </div>
          <div className="chart-wrapper">
            <Line data={revenueChartData} options={revenueChartOptions as any} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Revenue by day of week */}
        <div className="chart-container">
          <div className="section-header">
            <h3 className="section-title">
              <span className="icon">📅</span>
              Doanh thu theo thứ
            </h3>
          </div>
          <div className="chart-wrapper" style={{ height: 220 }}>
            <Bar data={dowChartData} options={barOptions as any} />
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="chart-container">
          <div className="section-header">
            <h3 className="section-title">
              <span className="icon">💸</span>
              Cơ cấu chi phí tháng
            </h3>
          </div>
          <div className="chart-wrapper" style={{ height: 220 }}>
            <Doughnut data={costData} options={donutOptions as any} />
          </div>
        </div>
      </div>

      {/* Top selling items */}
      <div className="chart-container" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <h3 className="section-title">
            <span className="icon">🏆</span>
            Top 5 sản phẩm bán chạy nhất
          </h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên sản phẩm</th>
                <th>Số lượng bán</th>
                <th>Doanh thu</th>
                <th>Tỉ lệ doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, idx) => {
                const maxRev = Math.max(...topItems.map(i => i.revenue));
                const pct = maxRev > 0 ? (item.revenue / maxRev) * 100 : 0;
                return (
                  <tr key={idx}>
                    <td>
                      <span style={{
                        width: 24, height: 24,
                        background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-elevated)',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: idx === 0 ? '#fbbf24' : 'var(--text-tertiary)',
                      }}>
                        {idx === 0 ? '🥇' : idx + 1}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.count} phần</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 700 }}>
                      {fmtCur(item.revenue)}
                    </td>
                    <td style={{ width: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-container" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: 'var(--gradient-primary)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: 35 }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>
          <span className="icon">💼</span> Tóm tắt tài chính tháng
        </h3>
        <div className="grid-3">
          {[
            { label: 'Doanh thu', value: stats.monthRev, color: 'var(--success-text)' },
            { label: 'Giá vốn (COGS)', value: -stats.monthCOGS, color: 'var(--danger-text)' },
            { label: 'Chi phí cố định', value: -stats.monthlyFixed, color: 'var(--warning-text)' },
            { label: 'Chi phí nhân sự', value: -stats.staffCost, color: 'var(--info-text)' },
            { label: 'Lợi nhuận gộp', value: stats.monthRev - stats.monthCOGS, color: 'var(--accent-cyan)' },
            { label: 'Lợi nhuận ròng', value: stats.profit, color: stats.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '16px',
              background: 'var(--bg-elevated)',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color, fontFamily: 'var(--font-mono)' }}>
                {item.value >= 0 ? '+' : ''}{fmtCur(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
