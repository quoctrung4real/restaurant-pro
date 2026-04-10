import { useMemo, useState } from 'react';
import type { AppData } from '../../data/store';

interface ReportsViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function ReportsView({ data }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { revenue: number; orders: number }> = {};
    data.revenues.forEach(r => {
      const month = r.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { revenue: 0, orders: 0 };
      byMonth[month].revenue += r.amount;
      byMonth[month].orders += r.orderCount;
    });

    return Object.entries(byMonth)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .map(([month, stats]) => ({
        period: month,
        label: new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
        ...stats,
        avgOrder: stats.orders > 0 ? stats.revenue / stats.orders : 0,
      }));
  }, [data]);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = monthlyData.reduce((s, m) => s + m.orders, 0);

  const exportCSV = () => {
    const headers = ['Tháng', 'Doanh thu', 'Số đơn', 'TB/đơn'];
    const rows = monthlyData.map(m => [m.label, m.revenue, m.orders, Math.round(m.avgOrder)].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('✅ Đã xuất file CSV thành công!');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const exportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      businessName: data.businessName,
      summary: {
        totalRevenue,
        totalOrders,
        productCount: data.menuItems.length,
        employeeCount: data.employees.length,
        customerCount: data.customers.length,
      },
      monthlyRevenue: monthlyData,
      menuItems: data.menuItems.map(i => ({ name: i.name, price: i.price, cost: i.cost })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('✅ Đã xuất file JSON thành công!');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="page-content">
      {exportStatus && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {exportStatus}
        </div>
      )}

      {/* Export actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>📤 Xuất báo cáo</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={exportCSV}>
            📊 Xuất Excel/CSV
          </button>
          <button className="btn btn-secondary" onClick={exportJSON}>
            📋 Xuất JSON
          </button>
          <button className="btn btn-ghost" onClick={printReport}>
            🖨️ In báo cáo
          </button>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          File CSV có thể mở bằng Microsoft Excel hoặc Google Sheets
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '📈', label: 'Tổng doanh thu', value: fmtCur(totalRevenue), color: 'green' },
          { icon: '🧾', label: 'Tổng số đơn', value: fmt(totalOrders), color: 'blue' },
          { icon: '💰', label: 'TB doanh thu/tháng', value: fmtCur(totalRevenue / (monthlyData.length || 1)), color: 'orange' },
          { icon: '📊', label: 'TB giá trị đơn', value: fmtCur(totalOrders > 0 ? totalRevenue / totalOrders : 0), color: 'violet' },
        ].map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className={`kpi-icon ${k.color}`} style={{ marginBottom: 8 }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="section-title">📋 Báo cáo theo thời gian</h3>
        <div className="tabs">
          {([['daily', 'Theo ngày'], ['monthly', 'Theo tháng'], ['yearly', 'Theo năm']] as const).map(([v, l]) => (
            <button key={v} className={`tab-btn ${reportType === v ? 'active' : ''}`} onClick={() => setReportType(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Monthly Report Table */}
      <div className="table-container" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Kỳ báo cáo</th>
              <th>Doanh thu</th>
              <th>Số đơn hàng</th>
              <th>TB/đơn</th>
              <th>Chi phí ướctính (32%)</th>
              <th>Lợi nhuận gộp</th>
              <th>Biên GP</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m, i) => {
              const cogs = m.revenue * 0.32;
              const gross = m.revenue - cogs;
              const margin = m.revenue > 0 ? (gross / m.revenue * 100) : 0;
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 700 }}>
                    {fmtCur(m.revenue)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(m.orders)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {fmtCur(m.avgOrder)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-text)' }}>
                    -{fmtCur(cogs)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-text)', fontWeight: 600 }}>
                    {fmtCur(gross)}
                  </td>
                  <td>
                    <span className={`badge ${margin >= 65 ? 'badge-success' : margin >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <td style={{ fontWeight: 800, color: 'var(--text-primary)', padding: '12px 16px' }}>TỔNG CỘNG</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-400)', padding: '12px 16px' }}>{fmtCur(totalRevenue)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '12px 16px' }}>{fmt(totalOrders)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', padding: '12px 16px' }}>{fmtCur(totalOrders > 0 ? totalRevenue / totalOrders : 0)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger-text)', fontWeight: 700, padding: '12px 16px' }}>-{fmtCur(totalRevenue * 0.32)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-text)', fontWeight: 800, padding: '12px 16px' }}>{fmtCur(totalRevenue * 0.68)}</td>
              <td style={{ padding: '12px 16px' }}><span className="badge badge-success">68%</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Business Summary Card */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>🏪 Tóm tắt hoạt động kinh doanh</h3>
        <div className="grid-3">
          {[
            { icon: '📋', label: 'Tổng sản phẩm', value: data.menuItems.length, sub: `${data.menuItems.filter(i => i.available).length} đang bán` },
            { icon: '📦', label: 'Nguyên liệu', value: data.ingredients.length, sub: `${data.ingredients.filter(i => i.stock <= i.minStock).length} sắp hết` },
            { icon: '👥', label: 'Nhân viên', value: data.employees.length, sub: `${data.employees.filter(e => e.status === 'active').length} đang làm` },
            { icon: '👤', label: 'Khách hàng', value: data.customers.length, sub: `${data.customers.filter(c => c.segment === 'vip').length} VIP` },
            { icon: '🍽️', label: 'Số bàn', value: data.tables.length, sub: `${data.tables.filter(t => t.status === 'occupied').length} có khách` },
            { icon: '🧾', label: 'Tổng đơn đã xử lý', value: data.orders.filter(o => o.status === 'paid').length, sub: 'Thanh toán thành công' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-elevated)',
              borderRadius: 10, border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
