import type { AppData } from '../../data/store';
import type { AdminUser, AdminStatus } from '../../types';

interface AdminManagementViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  currentUser: AdminUser | null;
}

export default function AdminManagementView({ data, updateData, currentUser }: AdminManagementViewProps) {
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

  return (
    <div className="page-content">
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        {/* Danh sách tài khoản */}
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>👥 Quản trị Tài khoản Admin</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
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
                  <td>
                    {u.id !== currentUser.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {u.status !== 'approved' && (
                          <button className="btn btn-primary" onClick={() => handleUpdateStatus(u.id, 'approved')} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Duyệt</button>
                        )}
                        {u.status !== 'rejected' && (
                          <button className="btn btn-outline" onClick={() => handleUpdateStatus(u.id, 'rejected')} style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>Khóa</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lịch sử đăng nhập */}
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>📋 Lịch sử Đăng nhập Hệ thống</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
            {data.loginLogs.slice(0, 50).map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: `3px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}` }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>@{log.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{log.device}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: '0.8rem', color: log.status === 'success' ? '#10b981' : '#ef4444', marginTop: 4 }}>
                    {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </div>
                </div>
              </div>
            ))}
            {data.loginLogs.length === 0 && (
              <div style={{ color: 'var(--text-tertiary)' }}>Chưa có dữ liệu.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
