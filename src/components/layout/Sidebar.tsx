import type { AppView, AdminUser } from '../../types';
import type { AppData } from '../../data/store';

type NavItem = {
  id: AppView;
  label: string;
  icon: string;
  section?: string;
  roles?: ('superadmin' | 'admin' | 'public')[];
};

const navItems: NavItem[] = [
  { id: 'pos', label: 'Bán hàng (POS)', icon: '🧾', roles: ['public', 'admin', 'superadmin'] },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'TỔNG QUAN', roles: ['admin', 'superadmin'] },
  { id: 'menu', label: 'Thực đơn', icon: '📋', section: 'QUẢN LÝ', roles: ['admin', 'superadmin'] },
  { id: 'inventory', label: 'Kho nguyên liệu', icon: '📦', roles: ['admin', 'superadmin'] },
  { id: 'staff', label: 'Nhân sự', icon: '👥', roles: ['admin', 'superadmin'] },
  { id: 'customers', label: 'Khách hàng', icon: '👤', roles: ['admin', 'superadmin'] },
  { id: 'finance', label: 'Kế toán', icon: '💰', section: 'TÀI CHÍNH & AI', roles: ['admin', 'superadmin'] },
  { id: 'forecast', label: 'Dự báo AI', icon: '🔮', roles: ['admin', 'superadmin'] },
  { id: 'pricing', label: 'Tính giá thông minh', icon: '🏷️', roles: ['admin', 'superadmin'] },
  { id: 'engineering', label: 'Phân tích Menu', icon: '🎯', roles: ['admin', 'superadmin'] },
  { id: 'reports', label: 'Báo cáo', icon: '📄', section: 'TIỆN ÍCH', roles: ['admin', 'superadmin'] },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️', roles: ['admin', 'superadmin'] },
  { id: 'admin', label: 'Quản trị Tài khoản', icon: '🛡️', roles: ['superadmin'] },
];

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  data: AppData;
  currentUser: AdminUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onNavigate, data, currentUser, onOpenAuth, onLogout }: SidebarProps) {
  // Count alerts
  const lowStockCount = data.ingredients.filter(i => i.stock <= i.minStock).length;
  const occupiedTables = data.tables.filter(t => t.status === 'occupied').length;
  const openOrders = data.orders.filter(o => o.status === 'open').length;

  const currentRole = currentUser ? currentUser.role : 'public';
  const visibleNavItems = navItems.filter(item => item.roles?.includes(currentRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍽️</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">RestaurantPro</span>
          <span className="sidebar-logo-sub">
            {currentUser ? `Hi, ${currentUser.fullName} (${currentUser.role})` : 'Kiosk Bán Hàng'}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item, index) => {
          // Determine if we should show the section label
          const isFirstInSection = item.section && 
            (index === 0 || visibleNavItems[index - 1].section !== item.section);

          return (
            <div key={item.id}>
              {isFirstInSection && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <div
                className={`sidebar-nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.id === 'inventory' && lowStockCount > 0 && (
                  <span className="nav-badge">{lowStockCount}</span>
                )}
                {item.id === 'pos' && occupiedTables > 0 && (
                  <span className="nav-badge" style={{ background: 'rgba(59,130,246,0.8)' }}>{occupiedTables}</span>
                )}
                {item.id === 'pos' && openOrders > 0 && (
                  <span className="nav-badge" style={{ background: 'rgba(245,158,11,0.8)' }}>{openOrders}</span>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="sidebar-business-info">
          <div className="business-avatar">🏪</div>
          <div>
            <div className="business-name">{data.businessName}</div>
            <div className="business-type">{data.businessType}</div>
          </div>
        </div>
        
        {currentUser ? (
          <button className="btn btn-outline" onClick={onLogout} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            Đăng xuất
          </button>
        ) : (
          <button className="btn btn-outline" onClick={onOpenAuth} style={{ width: '100%' }}>
            🔐 Đăng nhập Quản lý
          </button>
        )}
      </div>
    </aside>
  );
}
