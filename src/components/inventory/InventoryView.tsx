import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../../data/store';
import type { Ingredient } from '../../types';

interface InventoryViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function InventoryView({ data, updateData }: InventoryViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Ingredient> | null>(null);
  const [showRestock, setShowRestock] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  const filtered = data.ingredients.filter(i =>
    (search === '' || i.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterLow || i.stock <= i.minStock)
  );

  const lowStock = data.ingredients.filter(i => i.stock <= i.minStock);
  const totalValue = data.ingredients.reduce((s, i) => s + i.stock * i.costPerUnit, 0);

  const openAdd = () => {
    setEditItem({ id: uuidv4(), name: '', unit: 'gram', stock: 0, minStock: 100, costPerUnit: 0 });
    setShowModal(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditItem({ ...item });
    setShowModal(true);
  };

  const saveItem = () => {
    if (!editItem?.name) return;
    const item = editItem as Ingredient;
    updateData(prev => {
      const exists = prev.ingredients.find(i => i.id === item.id);
      if (exists) return { ...prev, ingredients: prev.ingredients.map(i => i.id === item.id ? item : i) };
      return { ...prev, ingredients: [...prev.ingredients, item] };
    });
    setShowModal(false);
  };

  const handleRestock = () => {
    if (!showRestock || restockQty <= 0) return;
    updateData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i =>
        i.id === showRestock.id
          ? { ...i, stock: i.stock + restockQty, lastRestocked: new Date().toISOString().split('T')[0] }
          : i
      )
    }));
    setShowRestock(null);
    setRestockQty(0);
  };

  const stockLevel = (i: Ingredient) => {
    const pct = i.minStock > 0 ? (i.stock / (i.minStock * 3)) * 100 : 100;
    return Math.min(100, pct);
  };

  return (
    <div className="page-content">
      {showModal && editItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {data.ingredients.find(i => i.id === editItem.id) ? '✏️ Chỉnh sửa' : '➕ Thêm'} nguyên liệu
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên nguyên liệu *</label>
                <input className="form-input" value={editItem.name || ''}
                  onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} placeholder="VD: Cà phê rang xay" />
              </div>
              <div className="form-group">
                <label className="form-label">Đơn vị tính</label>
                <select className="form-select" value={editItem.unit || 'gram'}
                  onChange={e => setEditItem(p => ({ ...p, unit: e.target.value }))}>
                  <option value="gram">gram</option>
                  <option value="ml">ml (mililít)</option>
                  <option value="kg">kg</option>
                  <option value="lít">lít</option>
                  <option value="cái">cái</option>
                  <option value="hộp">hộp</option>
                  <option value="túi">túi</option>
                  <option value="quả">quả</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tồn kho hiện tại</label>
                <input className="form-input" type="number" value={editItem.stock || 0}
                  onChange={e => setEditItem(p => ({ ...p, stock: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mức tồn kho tối thiểu</label>
                <input className="form-input" type="number" value={editItem.minStock || 0}
                  onChange={e => setEditItem(p => ({ ...p, minStock: +e.target.value }))} placeholder="Cảnh báo khi dưới mức này" />
              </div>
              <div className="form-group col-span-2">
                <label className="form-label">Giá nhập / đơn vị (đ)</label>
                <input className="form-input" type="number" value={editItem.costPerUnit || 0}
                  onChange={e => setEditItem(p => ({ ...p, costPerUnit: +e.target.value }))} placeholder="VD: 350 (đ/gram)" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveItem}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {showRestock && (
        <div className="modal-overlay" onClick={() => setShowRestock(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📥 Nhập kho: {showRestock.name}</h3>
              <button className="modal-close" onClick={() => setShowRestock(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12,
                padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tồn kho hiện tại:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {fmt(showRestock.stock)} {showRestock.unit}
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Số lượng nhập thêm ({showRestock.unit})</label>
                <input className="form-input" type="number" value={restockQty || ''}
                  onChange={e => setRestockQty(+e.target.value)} placeholder="Nhập số lượng..." autoFocus />
              </div>
              {restockQty > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--success-bg)',
                  borderRadius: 8, border: '1px solid var(--success-border)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--success-text)' }}>
                    ✅ Sau nhập: <strong>{fmt(showRestock.stock + restockQty)} {showRestock.unit}</strong>
                    {' '}— Chi phí: <strong>{fmtCur(restockQty * showRestock.costPerUnit)}</strong>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRestock(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleRestock} disabled={restockQty <= 0}>
                📥 Xác nhận nhập kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon blue" style={{ marginBottom: 8 }}>📦</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{data.ingredients.length}</div>
          <div className="kpi-label">Loại nguyên liệu</div>
        </div>
        <div className={`kpi-card ${lowStock.length > 0 ? 'danger' : ''}`}>
          <div className={`kpi-icon ${lowStock.length > 0 ? 'rose' : 'green'}`} style={{ marginBottom: 8 }}>⚠️</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', color: lowStock.length > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
            {lowStock.length}
          </div>
          <div className="kpi-label">Nguyên liệu sắp hết</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon amber" style={{ marginBottom: 8 }}>💵</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{fmtCur(totalValue)}</div>
          <div className="kpi-label">Giá trị kho hiện tại</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon violet" style={{ marginBottom: 8 }}>🏪</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{data.suppliers.length || 0}</div>
          <div className="kpi-label">Nhà cung cấp</div>
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span>⚠️</span>
          <div>
            <strong>Cần nhập hàng:</strong> {lowStock.map(i =>
              `${i.name} (còn ${fmt(i.stock)} ${i.unit})`).join(' • ')}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="section-header">
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
          📦 Danh sách nguyên liệu
        </h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input className="form-input" style={{ width: 180 }} placeholder="🔍 Tìm kiếm..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button
            className={`btn ${filterLow ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterLow(!filterLow)}
          >
            {filterLow ? '⚠️ Sắp hết' : '⚠️ Lọc sắp hết'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>➕ Thêm nguyên liệu</button>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Nguyên liệu</th>
              <th>Đơn vị</th>
              <th>Tồn kho</th>
              <th>Tối thiểu</th>
              <th>Mức tồn kho</th>
              <th>Giá/đơn vị</th>
              <th>Tổng giá trị</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const level = stockLevel(item);
              const low = item.stock <= item.minStock;
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {low && <span style={{ marginRight: 6 }}>⚠️</span>}
                    {item.name}
                  </td>
                  <td><span className="badge badge-neutral">{item.unit}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: low ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                    {fmt(item.stock)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {fmt(item.minStock)}
                  </td>
                  <td style={{ width: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-container" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{
                          width: `${level}%`,
                          background: level < 35 ? 'var(--accent-rose)' : level < 60 ? '#f59e0b' : 'var(--gradient-success)',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', minWidth: 30 }}>
                        {level.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {fmtCur(item.costPerUnit)}/{item.unit}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-400)', fontWeight: 600 }}>
                    {fmtCur(item.stock * item.costPerUnit)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success btn-sm" onClick={() => { setShowRestock(item); setRestockQty(0); }}>
                        📥 Nhập
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)}>✏️</button>
                    </div>
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
