import { useState } from 'react';
import type { AppData } from '../../data/store';
import { loadData } from '../../data/store';
import type { AdminUser, AdminStatus } from '../../types';

interface AdminManagementViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  currentUser: AdminUser | null;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function AdminManagementView({ data, updateData, currentUser }: AdminManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'fraud' | 'backup' | 'logs'>('accounts');

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ fontSize: 48, marginBottom: 16 }}>🛡️</h2>
          <h3 style={{ color: '#ef4444' }}>Truy cập bị từ chối</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Bạn cần quyền Super Admin để xem trang này.</p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = (userId: string, newStatus: AdminStatus) => {
    updateData(d => ({
      ...d,
      users: d.users.map(u => u.id === userId ? { ...u, status: newStatus } : u)
    }));
  };

  // --- DATA BACKUP LOGIC ---
  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `restaurantpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], 'UTF-8');
    fileReader.onload = evt => {
      try {
        const parsedData = JSON.parse(evt.target?.result as string);
        if (parsedData && parsedData.users && parsedData.orders) {
          updateData(() => parsedData as AppData);
          alert('Khôi phục dữ liệu thành công!');
        } else {
          alert('Định dạng file không tương thích với hệ thống!');
        }
      } catch {
        alert('File JSON bị lỗi hoặc hỏng!');
      }
    };
  };

  const handleFactoryReset = () => {
    if (window.confirm('CẢNH BÁO: BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ DỮ LIỆU HIỆN CÓ? Hành động này không thể hoàn tác!')) {
      const prompt = window.prompt("Nhập 'RESET' để xác nhận:");
      if (prompt === 'RESET') {
        updateData(() => loadData());
        alert('Đã khôi phục dữ liệu về mặc định nhà máy!');
      }
    }
  };

  // --- FRAUD DETECTION LOGIC ---
  const fraudOrders = data.orders.filter(o => {
    const isCancelled = o.status === 'cancelled';
    const isHighDiscount = o.subtotal > 0 && (o.discount / o.subtotal) >= 0.3; // >= 30% discount
    return isCancelled || isHighDiscount;
  });

  const totalFraudRisk = fraudOrders.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="page-content">
      {/* Tabs Menu */}
      <div className="tabs" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
        <button className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
          👥 Quản lý Quyền
        </button>
        <button className={`tab-btn ${activeTab === 'fraud' ? 'active' : ''}`} onClick={() => setActiveTab('fraud')}>
          🚨 Nhận diện Gian lận
          {fraudOrders.length > 0 && <span className="badge" style={{ background: '#ef4444', color: '#fff', marginLeft: 8 }}>{fraudOrders.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          📋 Nhật ký Hệ thống
        </button>
        <button className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
          💾 Sao lưu Dữ liệu
        </button>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: '1fr', alignItems: 'start' }}>
        
        {/* TAB 1: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>👥 Quản trị Tài khoản Admin</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Gia nhập</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: u.role === 'superadmin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: u.role === 'superadmin' ? '#8b5cf6' : '#3b82f6' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: u.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : u.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: u.status === 'approved' ? '#10b981' : u.status === 'pending' ? '#f59e0b' : '#ef4444' 
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.id !== currentUser.id && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {u.status !== 'approved' && (
                            <button className="btn btn-primary" onClick={() => handleUpdateStatus(u.id, 'approved')} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>Duyệt</button>
                          )}
                          {u.status !== 'rejected' && (
                            <button className="btn btn-outline" onClick={() => handleUpdateStatus(u.id, 'rejected')} style={{ padding: '6px 16px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>Khóa</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: FRAUD DETECTION */}
        {activeTab === 'fraud' && (
          <div className="card" style={{ border: '2px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#ef4444', marginBottom: 4 }}>🚨 Radar Cảnh báo Gian lận</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hệ thống tự động quét các dấu hiệu bất thường từ thu ngân.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng giá trị rủi ro</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{fmtCur(totalFraudRisk)}</div>
              </div>
            </div>

            {fraudOrders.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--success-text)', background: 'rgba(16,185,129,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛡️</div>
                <h3>Hệ thống An toàn</h3>
                <p>Không phát hiện hóa đơn đáng ngờ nào.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã ĐH</th>
                    <th>Thời gian</th>
                    <th>Giá trị Gốc</th>
                    <th>Dấu hiệu Gian lận</th>
                    <th>Thu ngân</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudOrders.map(o => {
                    const isCancelled = o.status === 'cancelled';
                    return (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{o.id.substring(0,8)}...</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(o.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>{fmtCur(o.subtotal)}</td>
                        <td>
                          {isCancelled ? (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Hóa đơn bị Hủy bỏ (Xóa mâm)</span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>Giảm giá {(o.discount / o.subtotal * 100).toFixed(0)}% quá cao</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Khuyết danh</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: SYSTEM LOGS */}
        {activeTab === 'logs' && (
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>📋 Lịch sử Đăng nhập Hệ thống</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
              {data.loginLogs.slice(0, 100).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, borderLeft: `4px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>{log.status === 'success' ? '✅' : '🚫'}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>@{log.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 4 }}>💻 {log.device}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', color: log.status === 'success' ? '#10b981' : '#ef4444', marginTop: 4, fontWeight: 600 }}>
                      {log.status === 'success' ? 'Login Thành công' : 'Bị chặn / Thất bại'}
                    </div>
                  </div>
                </div>
              ))}
              {data.loginLogs.length === 0 && (
                <div style={{ color: 'var(--text-tertiary)', padding: 24, textAlign: 'center' }}>Hệ thống chưa ghi nhận log truy cập nào.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card" style={{ border: '1px solid var(--primary-500)' }}>
              <h3>Tải bản Sao Lưu (Export)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 24px 0' }}>
                Đóng gói toàn bộ cấu hình, lịch sử hóa đơn ngàn ngày và thông tin khách VIP về máy của bạn dưới định dạng JSON siêu tốc.
              </p>
              <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%', padding: '12px' }}>
                ⬇️ Tải File Dữ Liệu
              </button>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--warning-text)' }}>Phục Hồi Dữ Liệu (Import)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 24px 0' }}>
                Tải lên file JSON đã backup trước đó. Hành động này sẽ thay thế TOÀN BỘ dữ liệu hiện tại bằng dữ liệu trong file.
              </p>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImport}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
                <button className="btn btn-outline" style={{ width: '100%', padding: '12px', pointerEvents: 'none' }}>
                  ⬆️ Chọn File Phục Hồi
                </button>
              </div>
            </div>

            <div className="card" style={{ gridColumn: '1 / -1', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ color: '#ef4444' }}>Vùng Nguy Hiểm (Danger Zone)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '12px 0 24px 0' }}>
                Factory Reset: Thao tác này sẽ dọn sạch mọi hóa đơn, khách hàng, cấu hình và khôi phục CSDL về dữ liệu mẫu (Seed Data). Tuyệt đối cẩn thận!
              </p>
              <button 
                className="btn" 
                onClick={handleFactoryReset}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}
              >
                🗑️ Factory Reset
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
