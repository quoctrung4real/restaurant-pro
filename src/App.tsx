import { useState, useEffect, useCallback } from 'react';
import type { AppView, AdminUser } from './types';
import type { AppData } from './data/store';
import { loadData, saveData } from './data/store';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import POSView from './components/pos/POSView';
import MenuView from './components/menu/MenuView';
import InventoryView from './components/inventory/InventoryView';
import StaffView from './components/staff/StaffView';
import FinanceView from './components/finance/FinanceView';
import ForecastView from './components/forecast/ForecastView';
import PricingView from './components/pricing/PricingView';
import EngineeringView from './components/engineering/EngineeringView';
import CustomersView from './components/customers/CustomersView';
import ReportsView from './components/reports/ReportsView';
import SettingsView from './components/settings/SettingsView';
import AdminManagementView from './components/admin/AdminManagementView';
import AuthView from './components/auth/AuthView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('pos');
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // Auto-save every 30s
    const interval = setInterval(() => saveData(data), 30000);
    return () => clearInterval(interval);
  }, [data]);

  const viewTitles: Record<AppView, { title: string; desc: string }> = {
    dashboard: { title: '📊 Dashboard', desc: 'Tổng quan hoạt động kinh doanh' },
    pos: { title: '🧾 Bán hàng (POS)', desc: 'Tạo đơn hàng và thanh toán' },
    menu: { title: '📋 Thực đơn & Sản phẩm', desc: 'Quản lý món ăn và đồ uống' },
    inventory: { title: '📦 Kho nguyên liệu', desc: 'Theo dõi tồn kho và nhập hàng' },
    staff: { title: '👥 Nhân sự & Lương', desc: 'Quản lý nhân viên và chấm công' },
    finance: { title: '💰 Kế toán & Tài chính', desc: 'Báo cáo lãi lỗ và dòng tiền' },
    forecast: { title: '🔮 Dự báo Doanh thu AI', desc: 'Dự đoán thông minh bằng machine learning' },
    pricing: { title: '🏷️ Tính giá thông minh', desc: 'Tối ưu giá bán để tối đa lợi nhuận' },
    engineering: { title: '🎯 Phân tích Menu', desc: 'Ma trận BCG và phân tích sản phẩm' },
    customers: { title: '👤 Khách hàng (CRM)', desc: 'Quản lý khách hàng thân thiết' },
    reports: { title: '📄 Báo cáo & Xuất file', desc: 'Xuất báo cáo PDF và Excel' },
    settings: { title: '⚙️ Cài đặt', desc: 'Cấu hình hệ thống' },
    admin: { title: '🛡️ Quản trị Tài khoản', desc: 'Quản lý tài khoản Admin và Nhật ký truy cập' },
  };

  const { title, desc } = viewTitles[currentView];

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('pos'); // Fallback to public permissible view
  };

  const renderView = () => {
    // Kiosk Mode Enforcer: Non-logged-in users can ONLY access POS
    if (!currentUser && currentView !== 'pos') {
      return (
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 style={{ fontSize: 48, marginBottom: 16 }}>🔒</h2>
            <h3 style={{ color: 'var(--text-primary)' }}>Vui lòng đăng nhập</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Bạn cần đăng nhập bằng tài khoản Quản lý để xem mục này.</p>
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>🔐 Đăng nhập Quản lý</button>
          </div>
        </div>
      );
    }

    const props = { data, updateData };
    switch (currentView) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'pos': return <POSView {...props} />;
      case 'menu': return <MenuView {...props} />;
      case 'inventory': return <InventoryView {...props} />;
      case 'staff': return <StaffView {...props} />;
      case 'finance': return <FinanceView {...props} />;
      case 'forecast': return <ForecastView {...props} />;
      case 'pricing': return <PricingView {...props} />;
      case 'engineering': return <EngineeringView {...props} />;
      case 'customers': return <CustomersView {...props} />;
      case 'reports': return <ReportsView {...props} />;
      case 'settings': return <SettingsView {...props} />;
      case 'admin': return <AdminManagementView {...props} currentUser={currentUser} />;
      default: return null;
    }
  };

  return (
    <div className="app">
      {showAuth && (
        <AuthView 
          data={data} 
          updateData={updateData} 
          onClose={() => setShowAuth(false)} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setShowAuth(false);
            setCurrentView('dashboard');
          }}
        />
      )}
      
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        data={data}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Header title={title} desc={desc} data={data} />
        {renderView()}
      </div>
    </div>
  );
}
