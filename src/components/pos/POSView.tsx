import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../../data/store';
import type { Order, OrderItem, Table } from '../../types';

interface POSViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function POSView({ data, updateData }: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [customerNote, setCustomerNote] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [transferCode, setTransferCode] = useState('');
  const [lastReceipt, setLastReceipt] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'order' | 'tables'>('order');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = data.menuItems.filter(item =>
    item.available &&
    (selectedCategory === 'all' || item.categoryId === selectedCategory) &&
    (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (itemId: string) => {
    const menuItem = data.menuItems.find(i => i.id === itemId);
    if (!menuItem) return;

    setCart(prev => {
      const exists = prev.find(c => c.menuItemId === itemId);
      if (exists) {
        return prev.map(c =>
          c.menuItemId === itemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        cost: menuItem.cost,
        quantity: 1,
      }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c =>
        c.menuItemId === itemId ? { ...c, quantity: c.quantity + delta } : c
      ).filter(c => c.quantity > 0);
      return updated;
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.08);
  const total = subtotal - discountAmount + taxAmount;

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'transfer') {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const shortCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      setTransferCode(`ORD${dateStr}-${shortCode}`);
    }
    setShowPayment(true);
  };

  const handlePay = () => {
    if (cart.length === 0) return;

    let customerId: string | undefined;

    updateData(prev => {
      let newCustomers = [...prev.customers];
      
      // CRM Logic: Auto-link or Create Customer
      if (customerPhone) {
        let existing = newCustomers.find(c => c.phone === customerPhone);
        if (existing) {
          customerId = existing.id;
          newCustomers = newCustomers.map(c => 
            c.id === existing!.id ? { 
              ...c, 
              visitCount: c.visitCount + 1, 
              totalSpent: c.totalSpent + total,
              lastVisit: new Date().toISOString()
            } : c
          );
        } else {
          customerId = uuidv4();
          newCustomers.push({
            id: customerId,
            name: 'Khách vãng lai',
            phone: customerPhone,
            points: Math.floor(total / 10000), // Mock points
            totalSpent: total,
            visitCount: 1,
            joinDate: new Date().toISOString(),
            segment: 'new',
            lastVisit: new Date().toISOString()
          });
        }
      }

      const order: Order = {
        id: uuidv4(),
        tableId: selectedTable?.id,
        tableNumber: selectedTable?.number,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        status: 'paid',
        paymentMethod,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        note: customerNote,
        customerId,
        customerPhone: customerPhone || undefined,
        transferCode: paymentMethod === 'transfer' ? transferCode : undefined
      };

      const newOrders = [...prev.orders, order];

      // Update table status
      const newTables = prev.tables.map(t =>
        t.id === selectedTable?.id ? { ...t, status: 'empty' as const, currentOrderId: undefined } : t
      );

      // Update revenue
      const today = new Date().toISOString().split('T')[0];
      const existingRevIdx = prev.revenues.findIndex(r => r.date === today);
      let newRevenues = [...prev.revenues];

      if (existingRevIdx >= 0) {
        newRevenues[existingRevIdx] = {
          ...newRevenues[existingRevIdx],
          amount: newRevenues[existingRevIdx].amount + total,
          orderCount: newRevenues[existingRevIdx].orderCount + 1,
        };
      } else {
        newRevenues.push({ date: today, amount: total, orderCount: 1, avgOrderValue: total });
      }

      setLastReceipt(order);
      return { ...prev, orders: newOrders, tables: newTables, revenues: newRevenues, customers: newCustomers };
    });

    setCart([]);
    setDiscount(0);
    setCustomerNote('');
    setCustomerPhone('');
    setSelectedTable(null);
    setShowPayment(false);
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setActiveTab('order');
    // Mark table as occupied
    if (cart.length === 0) {
      updateData(prev => ({
        ...prev,
        tables: prev.tables.map(t =>
          t.id === table.id ? { ...t, status: 'occupied' as const } : t
        )
      }));
    }
  };

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {lastReceipt && (
        <div className="modal-overlay" onClick={() => setLastReceipt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✅ Thanh toán thành công!</h3>
              <button className="modal-close" onClick={() => setLastReceipt(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                {fmtCur(lastReceipt.total)}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                Thanh toán: {lastReceipt.paymentMethod === 'cash' ? '💵 Tiền mặt' : lastReceipt.paymentMethod === 'transfer' ? '📱 Chuyển khoản' : '💳 Thẻ'}
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Món</th><th>SL</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {lastReceipt.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.menuItemName}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                        {fmtCur(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="order-summary-row">
                <span className="label">Tạm tính:</span>
                <span className="value">{fmtCur(lastReceipt.subtotal)}</span>
              </div>
              <div className="order-summary-row">
                <span className="label">Thuế (8%):</span>
                <span className="value">{fmtCur(lastReceipt.tax)}</span>
              </div>
              <div className="order-total-row">
                <span className="label">TỔNG CỘNG:</span>
                <span className="value">{fmtCur(lastReceipt.total)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setLastReceipt(null)}>
                🧾 Đơn mới
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && !lastReceipt && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Thanh toán Đơn hàng</h3>
              <button className="modal-close" onClick={() => setShowPayment(false)}>✕</button>
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Số điện thoại Khách hàng (Optional)</label>
              <input
                className="form-input"
                placeholder="Nhập SĐT để tích điểm..."
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>

            {paymentMethod === 'transfer' ? (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 16 }}>
                  <img 
                    src={`https://img.vietqr.io/image/${data.bankConfig.bankId}-${data.bankConfig.accountNumber}-${data.bankConfig.qrTemplate || 'compact'}.png?amount=${total}&addInfo=${transferCode}&accountName=${encodeURIComponent(data.bankConfig.accountName)}`} 
                    alt="VietQR code" 
                    style={{ width: 250, height: 250, objectFit: 'contain' }}
                  />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-400)' }}>{fmtCur(total)}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mã ĐH: <strong>{transferCode}</strong></div>
                
                <button 
                  className="btn btn-outline" 
                  onClick={handlePay}
                  style={{ marginTop: 24, width: '100%', borderColor: 'var(--success-text)', color: 'var(--success-text)' }}
                >
                  <span style={{ marginRight: 8, fontSize: '1.2rem' }}>🔔</span>
                  Mô phỏng Webhook: Nhận Tiền Thành Công
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{paymentMethod === 'cash' ? '💵' : '💳'}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary-400)' }}>Cần thu: {fmtCur(total)}</div>
              </div>
            )}

            {paymentMethod !== 'transfer' && (
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handlePay} style={{ width: '100%' }}>
                  Xác nhận Khách đã thanh toán
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pos-layout">
        {/* Left: Menu */}
        <div className="pos-menu">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'order' ? 'active' : ''}`}
                onClick={() => setActiveTab('order')}
              >
                🧾 Gọi món
              </button>
              <button
                className={`tab-btn ${activeTab === 'tables' ? 'active' : ''}`}
                onClick={() => setActiveTab('tables')}
              >
                🪑 Sơ đồ bàn
              </button>
            </div>
            {selectedTable && (
              <div className="badge badge-primary">
                Bàn {selectedTable.number} — {selectedTable.zone}
              </div>
            )}
          </div>

          {activeTab === 'order' ? (
            <>
              {/* Search */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', fontSize: '0.9rem', pointerEvents: 'none'
                  }}>🔍</span>
                  <input
                    className="form-input"
                    style={{ paddingLeft: 32, height: 36, fontSize: '0.85rem' }}
                    placeholder="Tìm kiếm món ăn..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-tertiary)',
                        cursor: 'pointer', fontSize: '0.9rem', padding: 2
                      }}
                    >✕</button>
                  )}
                </div>
              </div>
              {/* Categories */}
              <div className="pos-menu-categories">
                <button
                  className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  🍽️ Tất cả
                </button>
                {data.categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Menu Items Grid */}
              <div className="pos-items-grid">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="pos-item-card"
                    onClick={() => addToCart(item.id)}
                  >
                    <span className="pos-item-emoji">{item.emoji}</span>
                    <div className="pos-item-name">{item.name}</div>
                    <div className="pos-item-price">{fmtCur(item.price)}</div>
                    {cart.find(c => c.menuItemId === item.id) && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--primary-600)', color: 'white',
                        borderRadius: '50%', width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 800,
                      }}>
                        {cart.find(c => c.menuItemId === item.id)?.quantity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Table Map */
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Khu A', 'Khu B'].map(zone => (
                  <div key={zone} style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {zone}
                    </div>
                    <div className="table-map">
                      {data.tables.filter(t => t.zone === zone).map(table => (
                        <div
                          key={table.id}
                          className={`table-card ${selectedTable?.id === table.id ? 'selected' : table.status}`}
                          onClick={() => handleSelectTable(table)}
                        >
                          <div className="table-num">{table.number}</div>
                          <div style={{ fontSize: '0.68rem' }}>
                            {table.status === 'empty' ? '✅ Trống' :
                             table.status === 'occupied' ? '🔴 Có khách' : '🟡 Sẵn sàng'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                            {table.capacity} ghế
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                <span>✅ Trống</span>
                <span>🔴 Có khách</span>
                <span>🟡 Sẵn sàng TT</span>
                <span style={{ color: 'var(--primary-400)' }}>🔵 Đang chọn</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Panel */}
        <div className="order-panel">
          <div className="order-header">
            <span className="order-title">
              🛒 Đơn hàng {selectedTable ? `— Bàn ${selectedTable.number}` : ''}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              🗑️ Xóa
            </button>
          </div>

          <div className="order-items">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon">🛒</div>
                <div className="empty-state-title">Chưa có món</div>
                <div className="empty-state-desc">Chọn bàn và bấm vào món ăn để thêm vào đơn</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.menuItemId} className="order-item">
                  <div className="order-item-info">
                    <div className="order-item-name">{item.menuItemName}</div>
                    <div className="order-item-price">{fmtCur(item.price * item.quantity)}</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.menuItemId, -1)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.menuItemId, 1)}>+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="order-footer">
            {/* Discount */}
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Giảm giá (%)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 5, 10, 15, 20].map(d => (
                  <button
                    key={d}
                    onClick={() => setDiscount(d)}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 6,
                      border: `1px solid ${discount === d ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                      background: discount === d ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                      color: discount === d ? 'var(--primary-400)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                      transition: 'all 150ms',
                    }}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="order-summary-row">
              <span className="label">Tạm tính:</span>
              <span className="value">{fmtCur(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="order-summary-row">
                <span className="label">Giảm ({discount}%):</span>
                <span className="value" style={{ color: 'var(--success-text)' }}>-{fmtCur(discountAmount)}</span>
              </div>
            )}
            <div className="order-summary-row">
              <span className="label">Thuế VAT (8%):</span>
              <span className="value">{fmtCur(taxAmount)}</span>
            </div>

            <div className="order-total-row">
              <span className="label">TỔNG CỘNG</span>
              <span className="value">{fmtCur(total)}</span>
            </div>

            {/* Payment method */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['cash', 'transfer', 'card'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    border: `1px solid ${paymentMethod === method ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                    background: paymentMethod === method ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                    color: paymentMethod === method ? 'var(--primary-400)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    transition: 'all 150ms', textAlign: 'center',
                  }}
                >
                  {method === 'cash' ? '💵 Tiền mặt' : method === 'transfer' ? '📱 Chuyển khoản' : '💳 Thẻ'}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', justifyContent: 'center' }}
              onClick={openPaymentModal}
              disabled={cart.length === 0}
            >
              💳 Tới Thanh toán {fmtCur(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
