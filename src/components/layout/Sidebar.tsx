import type { AppView } from '../../types';
import type { AppData } from '../../data/store';

type NavItem = {
  id: AppView;
  label: string;
  icon: string;
  section?: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'TỔNG QUAN' },
  { id: 'pos', label: 'Bán hàng (POS)', icon: '🧾' },
  { id: 'menu', label: 'Thực đơn', icon: '📋', section: 'QUẢN LÝ' },
  { id: 'inventory', label: 'Kho nguyên liệu', icon: '📦' },
  { id: 'staff', label: 'Nhân sự', icon: '👥' },
  { id: 'customers', label: 'Khách hàng', icon: '👤' },
  { id: 'finance', label: 'Kế toán', icon: '💰', section: 'TÀI CHÍNH & AI' },
  { id: 'forecast', label: 'Dự báo AI', icon: '🔮' },
  { id: 'pricing', label: 'Tính giá thông minh', icon: '🏷️' },
  { id: 'engineering', label: 'Phân tích Menu', icon: '🎯' },
  { id: 'reports', label: 'Báo cáo', icon: '📄', section: 'TIỆN ÍCH' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  data: AppData;
}

export default function Sidebar({ currentView, onNavigate, data }: SidebarProps) {
  // Count alerts
  const lowStockCount = data.ingredients.filter(i => i.stock <= i.minStock).length;
  const occupiedTables = data.tables.filter(t => t.status === 'occupied').length;
  const openOrders = data.orders.filter(o => o.status === 'open').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍽️</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">RestaurantPro</span>
          <span className="sidebar-logo-sub">Quản lý Nhà hàng</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div key={item.id}>
            {item.section && (
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
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-business-info">
          <div className="business-avatar">🏪</div>
          <div>
            <div className="business-name">{data.businessName}</div>
            <div className="business-type">{data.businessType}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
