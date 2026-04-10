import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../../data/store';
import type { MenuItem } from '../../types';

interface MenuViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

const emojis = ['☕', '🥛', '🍵', '🧊', '🍮', '🍜', '🍲', '🥐', '🥚', '🍖', '🍝', '🥤', '🍊', '🥭', '🍓', '🍦', '🎂', '🍱', '🥗', '🫖'];

export default function MenuView({ data, updateData }: MenuViewProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [search, setSearch] = useState('');

  const filtered = data.menuItems.filter(i =>
    (selectedCat === 'all' || i.categoryId === selectedCat) &&
    (search === '' || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const getCatName = (id: string) => data.categories.find(c => c.id === id)?.name || 'Khác';

  const openAdd = () => {
    setEditItem({
      id: uuidv4(),
      name: '',
      categoryId: data.categories[0]?.id || '',
      price: 0,
      cost: 0,
      emoji: '☕',
      available: true,
      unit: 'ly',
    });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem({ ...item });
    setShowModal(true);
  };

  const saveItem = () => {
    if (!editItem || !editItem.name || !editItem.price) return;
    const item = editItem as MenuItem;

    updateData(prev => {
      const exists = prev.menuItems.find(i => i.id === item.id);
      if (exists) {
        return { ...prev, menuItems: prev.menuItems.map(i => i.id === item.id ? item : i) };
      }
      return { ...prev, menuItems: [...prev.menuItems, item] };
    });

    setShowModal(false);
    setEditItem(null);
  };

  const deleteItem = (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    updateData(prev => ({ ...prev, menuItems: prev.menuItems.filter(i => i.id !== id) }));
  };

  const toggleAvailable = (id: string) => {
    updateData(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(i =>
        i.id === id ? { ...i, available: !i.available } : i
      )
    }));
  };

  const margin = (item: MenuItem) =>
    item.price > 0 ? ((item.price - item.cost) / item.price * 100).toFixed(0) : '0';

  return (
    <div className="page-content">
      {showModal && editItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {data.menuItems.find(i => i.id === editItem.id) ? '✏️ Chỉnh sửa' : '➕ Thêm'} sản phẩm
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên sản phẩm *</label>
                <input
                  className="form-input"
                  value={editItem.name || ''}
                  onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="Tên món ăn / đồ uống"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Danh mục *</label>
                <select
                  className="form-select"
                  value={editItem.categoryId || ''}
                  onChange={e => setEditItem(p => ({ ...p, categoryId: e.target.value }))}
                >
                  {data.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Giá bán (đ) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={editItem.price || ''}
                  onChange={e => setEditItem(p => ({ ...p, price: +e.target.value }))}
                  placeholder="VD: 45000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chi phí nguyên liệu (đ)</label>
                <input
                  className="form-input"
                  type="number"
                  value={editItem.cost || ''}
                  onChange={e => setEditItem(p => ({ ...p, cost: +e.target.value }))}
                  placeholder="VD: 12000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Đơn vị</label>
                <input
                  className="form-input"
                  value={editItem.unit || ''}
                  onChange={e => setEditItem(p => ({ ...p, unit: e.target.value }))}
                  placeholder="ly / phần / cái..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-select"
                  value={editItem.available ? 'true' : 'false'}
                  onChange={e => setEditItem(p => ({ ...p, available: e.target.value === 'true' }))}
                >
                  <option value="true">✅ Đang bán</option>
                  <option value="false">⛔ Ngừng bán</option>
                </select>
              </div>
            </div>

            {/* Emoji Selector */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {emojis.map(e => (
                  <button
                    key={e}
                    onClick={() => setEditItem(p => ({ ...p, emoji: e }))}
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      border: `2px solid ${editItem.emoji === e ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                      background: editItem.emoji === e ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                      cursor: 'pointer', fontSize: '1.2rem',
                      transition: 'all 150ms',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Info */}
            {editItem.price && editItem.cost ? (
              <div className="pricing-result" style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Lợi nhuận/đơn</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                      +{fmtCur(editItem.price - editItem.cost)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Biên lợi nhuận</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
                      {((editItem.price - editItem.cost) / editItem.price * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Food cost %</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: editItem.cost / editItem.price > 0.4 ? 'var(--danger-text)' : 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                      {(editItem.cost / editItem.price * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveItem}>
                💾 Lưu sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            📋 Thực đơn ({data.menuItems.length} sản phẩm)
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ width: 200 }}
            placeholder="🔍 Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="pos-menu-categories" style={{ marginBottom: 20 }}>
        <button
          className={`category-btn ${selectedCat === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCat('all')}
        >
          Tất cả ({data.menuItems.length})
        </button>
        {data.categories.map(cat => {
          const count = data.menuItems.filter(i => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`category-btn ${selectedCat === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Chi phí NL</th>
              <th>Lợi nhuận</th>
              <th>Biên LN</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        Đơn vị: {item.unit}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-neutral">{getCatName(item.categoryId)}</span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-400)' }}>
                  {fmtCur(item.price)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {fmtCur(item.cost)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-text)', fontWeight: 600 }}>
                  +{fmtCur(item.price - item.cost)}
                </td>
                <td>
                  <span className={`badge ${+margin(item) >= 60 ? 'badge-success' : +margin(item) >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                    {margin(item)}%
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleAvailable(item.id)}
                    className={`badge ${item.available ? 'badge-success' : 'badge-danger'}`}
                    style={{ cursor: 'pointer', border: 'none', background: 'none' }}
                  >
                    {item.available ? '✅ Đang bán' : '⛔ Ngừng'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)} title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteItem(item.id)} title="Xóa">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
