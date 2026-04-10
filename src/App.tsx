import { useState, useEffect, useCallback } from 'react';
import type { AppView } from './types';
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

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [data, setData] = useState<AppData>(() => loadData());

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
  };

  const { title, desc } = viewTitles[currentView];

  const renderView = () => {
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
      case 'settings': return (
        <div className="page-content">
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>⚙️ Cài đặt hệ thống</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Tên cửa hàng</label>
              <input
                className="form-input"
                value={data.businessName}
                onChange={e => updateData(d => ({ ...d, businessName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Loại hình kinh doanh</label>
              <input
                className="form-input"
                value={data.businessType}
                onChange={e => updateData(d => ({ ...d, businessType: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        data={data}
      />
      <div className="main-content">
        <Header title={title} desc={desc} data={data} />
        {renderView()}
      </div>
    </div>
  );
}
