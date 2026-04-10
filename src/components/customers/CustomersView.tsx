import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../../data/store';
import type { Customer } from '../../types';

interface CustomersViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

const segmentConfig = {
  vip: { label: '👑 VIP', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  regular: { label: '🌟 Thường xuyên', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  new: { label: '🆕 Mới', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  inactive: { label: '💤 Không hoạt động', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
};

export default function CustomersView({ data, updateData }: CustomersViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editCust, setEditCust] = useState<Partial<Customer> | null>(null);
  const [filterSeg, setFilterSeg] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = data.customers.filter(c =>
    (filterSeg === 'all' || c.segment === filterSeg) &&
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
  );

  const totalCustomers = data.customers.length;
  const vipCount = data.customers.filter(c => c.segment === 'vip').length;
  const totalRevenue = data.customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgLTV = totalRevenue / (totalCustomers || 1);

  const openAdd = () => {
    setEditCust({
      id: uuidv4(),
      name: '',
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      joinDate: new Date().toISOString().split('T')[0],
      segment: 'new',
    });
    setShowModal(true);
  };

  const saveCust = () => {
    if (!editCust?.name) return;
    const cust = editCust as Customer;
    updateData(prev => {
      const exists = prev.customers.find(c => c.id === cust.id);
      if (exists) return { ...prev, customers: prev.customers.map(c => c.id === cust.id ? cust : c) };
      return { ...prev, customers: [...prev.customers, cust] };
    });
    setShowModal(false);
  };

  return (
    <div className="page-content">
      {showModal && editCust && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {data.customers.find(c => c.id === editCust.id) ? '✏️ Sửa' : '➕ Thêm'} khách hàng
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Họ tên *</label>
                <input className="form-input" value={editCust.name || ''} onChange={e => setEditCust(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" value={editCust.phone || ''} onChange={e => setEditCust(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={editCust.email || ''} onChange={e => setEditCust(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phân loại</label>
                <select className="form-select" value={editCust.segment || 'new'} onChange={e => setEditCust(p => ({ ...p, segment: e.target.value as Customer['segment'] }))}>
                  <option value="vip">👑 VIP</option>
                  <option value="regular">🌟 Thường xuyên</option>
                  <option value="new">🆕 Mới</option>
                  <option value="inactive">💤 Không hoạt động</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Điểm tích lũy</label>
                <input className="form-input" type="number" value={editCust.points || 0} onChange={e => setEditCust(p => ({ ...p, points: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tổng chi tiêu (đ)</label>
                <input className="form-input" type="number" value={editCust.totalSpent || 0} onChange={e => setEditCust(p => ({ ...p, totalSpent: +e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveCust}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: '👥', label: 'Tổng khách hàng', value: totalCustomers, color: 'blue' },
          { icon: '👑', label: 'Khách VIP', value: vipCount, color: 'amber' },
          { icon: '💰', label: 'Tổng doanh thu từ KH', value: fmtCur(totalRevenue), color: 'green' },
          { icon: '📊', label: 'LTV trung bình', value: fmtCur(avgLTV), color: 'violet' },
        ].map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className={`kpi-icon ${k.color}`} style={{ marginBottom: 8 }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Segment distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>📊 Phân bổ khách hàng theo phân khúc</h3>
        <div className="grid-4">
          {(['vip', 'regular', 'new', 'inactive'] as const).map(seg => {
            const count = data.customers.filter(c => c.segment === seg).length;
            const pct = totalCustomers > 0 ? (count / totalCustomers * 100) : 0;
            const cfg = segmentConfig[seg];
            return (
              <div key={seg} style={{
                padding: 16, borderRadius: 12,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                cursor: 'pointer',
                outline: filterSeg === seg ? `2px solid ${cfg.color}` : 'none',
              }} onClick={() => setFilterSeg(filterSeg === seg ? 'all' : seg)}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color, marginBottom: 8 }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                  {count}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar-container" style={{ height: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>{pct.toFixed(0)}% tổng</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="section-header">
        <h3 className="section-title">
          👤 Danh sách khách hàng ({filtered.length})
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input className="form-input" style={{ width: 200 }} placeholder="🔍 Tìm kiếm..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={openAdd}>➕ Thêm</button>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr><th>Khách hàng</th><th>Phân khúc</th><th>Điểm</th><th>Tổng chi tiêu</th><th>Lượt ghé thăm</th><th>Lần cuối</th><th>Ngày tham gia</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const cfg = segmentConfig[c.segment];
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 700, color: cfg.color,
                      }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.72rem', fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning-text)', fontWeight: 600 }}>
                    ✨ {fmt(c.points)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 700 }}>
                    {fmtCur(c.totalSpent)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.visitCount} lần</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.lastVisit || '—'}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{c.joinDate}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditCust({ ...c }); setShowModal(true); }}>✏️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
