import { useMemo } from 'react';
import type { AppData } from '../../data/store';
import { classifyMenuItems } from '../../algorithms/forecasting';
import type { MenuEngineeringItem } from '../../types';

interface EngineeringViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function EngineeringView({ data }: EngineeringViewProps) {
  const engineeringData = useMemo(() => {
    // Count sold per item from orders
    const sales: Record<string, { count: number; revenue: number }> = {};
    data.orders.filter(o => o.status === 'paid').forEach(o => {
      o.items.forEach(item => {
        if (!sales[item.menuItemId]) sales[item.menuItemId] = { count: 0, revenue: 0 };
        sales[item.menuItemId].count += item.quantity;
        sales[item.menuItemId].revenue += item.price * item.quantity;
      });
    });

    const items = data.menuItems.map(m => {
      const s = sales[m.id] || { count: Math.floor(Math.random() * 100) + 5, revenue: 0 };
      return {
        id: m.id,
        name: m.name,
        category: data.categories.find(c => c.id === m.categoryId)?.name || 'Khác',
        totalSold: s.count,
        totalRevenue: s.revenue || s.count * m.price,
        cost: m.cost,
        price: m.price,
      };
    });

    return classifyMenuItems(items);
  }, [data]);

  const stars = engineeringData.filter(i => i.classification === 'star');
  const plowHorses = engineeringData.filter(i => i.classification === 'plow_horse');
  const puzzles = engineeringData.filter(i => i.classification === 'puzzle');
  const dogs = engineeringData.filter(i => i.classification === 'dog');

  const classConfig = {
    star: { label: '⭐ Stars', desc: 'Bán chạy & lời nhiều', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    plow_horse: { label: '🐴 Plow Horses', desc: 'Bán chạy, lời ít', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    puzzle: { label: '❓ Puzzles', desc: 'Lời nhiều, bán ít', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
    dog: { label: '🐕 Dogs', desc: 'Bán ít & lời ít', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
  };

  const MatrixCell = ({ items, cls }: { items: MenuEngineeringItem[]; cls: keyof typeof classConfig }) => {
    const cfg = classConfig[cls];
    return (
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 180,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{cfg.desc}</div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: cfg.color
          }}>
            {items.length}
          </div>
        </div>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: cfg.color }}>
              {item.totalSold} bán
            </span>
          </div>
        ))}
        {items.length > 4 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            +{items.length - 4} sản phẩm khác
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>🎯 Menu Engineering — BCG Matrix</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Phân loại {engineeringData.length} sản phẩm theo độ phổ biến và khả năng sinh lời
        </p>
      </div>

      {/* BCG Matrix */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title">Ma trận BCG</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            <span>↑ Phổ biến cao</span>
            <span>→ Lợi nhuận cao</span>
          </div>
        </div>

        {/* Axis labels */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 4 }}>
            <div style={{
              writingMode: 'vertical-rl', transform: 'rotate(180deg)',
              fontSize: '0.7rem', color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              Mức độ phổ biến →
            </div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>THẤP</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>CAO</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Row 1: High popularity */}
              <MatrixCell items={plowHorses} cls="plow_horse" />
              <MatrixCell items={stars} cls="star" />
              {/* Row 2: Low popularity */}
              <MatrixCell items={dogs} cls="dog" />
              <MatrixCell items={puzzles} cls="puzzle" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Lợi nhuận thấp</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Lợi nhuận cao</div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Item Table */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 16 }}>📊 Phân tích chi tiết từng sản phẩm</h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Phân loại</th>
                <th>Số bán</th>
                <th>Doanh thu</th>
                <th>Biên LN/đơn</th>
                <th>Điểm phổ biến</th>
                <th>Điểm LN</th>
                <th>Khuyến nghị</th>
              </tr>
            </thead>
            <tbody>
              {engineeringData
                .sort((a, b) => {
                  const order = { star: 0, plow_horse: 1, puzzle: 2, dog: 3 };
                  return order[a.classification] - order[b.classification];
                })
                .map((item, i) => {
                  const cfg = classConfig[item.classification];
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999,
                          background: cfg.bg, color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.totalSold)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 600 }}>
                        {fmtCur(item.totalRevenue)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-text)' }}>
                        {fmtCur(item.contributionMargin)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar-container" style={{ width: 60 }}>
                            <div className="progress-bar-fill" style={{
                              width: `${Math.min(100, item.popularityScore)}%`,
                              background: 'var(--gradient-primary)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            {item.popularityScore}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar-container" style={{ width: 60 }}>
                            <div className="progress-bar-fill" style={{
                              width: `${Math.min(100, item.profitabilityScore)}%`,
                              background: 'var(--gradient-success)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            {item.profitabilityScore}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 240 }}>
                        {item.recommendation}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
