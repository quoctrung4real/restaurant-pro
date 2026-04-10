import type { AppData } from '../../data/store';

interface SettingsViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

export default function SettingsView({ data, updateData }: SettingsViewProps) {
  return (
    <div className="page-content">
      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        
        {/* Cài đặt Hệ thống chung */}
        <div className="card">
          <h2 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>⚙️ Thông tin Cửa hàng</h2>
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

        {/* Cấu hình Thanh toán Bank Transfer */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: 'var(--text-primary)' }}>🏦 Cấu hình Thanh toán (VietQR)</h2>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Đang hoạt động</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Hỗ trợ tạo mã QR tự động tại quầy thu ngân với VietQR API.
          </p>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Ngân hàng (Mã định danh)</label>
            <select 
              className="form-input"
              value={data.bankConfig.bankId}
              onChange={e => updateData(d => ({ ...d, bankConfig: { ...d.bankConfig, bankId: e.target.value } }))}
            >
              <option value="MB">Ngân hàng Quân Đội (MBBank)</option>
              <option value="VCB">Vietcombank</option>
              <option value="TCB">Techcombank</option>
              <option value="VPB">VPBank</option>
              <option value="ACB">ACB</option>
              <option value="BIDV">BIDV</option>
              <option value="CTG">VietinBank</option>
              <option value="TPB">TPBank</option>
            </select>
            <small style={{ color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Ví dụ: MB, VCB, TCB...</small>
          </div>
          
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Số tài khoản</label>
            <input
              className="form-input"
              value={data.bankConfig.accountNumber}
              onChange={e => updateData(d => ({ ...d, bankConfig: { ...d.bankConfig, accountNumber: e.target.value } }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Tên chủ tài khoản</label>
            <input
              className="form-input"
              value={data.bankConfig.accountName}
              onChange={e => updateData(d => ({ ...d, bankConfig: { ...d.bankConfig, accountName: e.target.value } }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mẫu QR (Template VietQR)</label>
            <select 
              className="form-input"
              value={data.bankConfig.qrTemplate}
              onChange={e => updateData(d => ({ ...d, bankConfig: { ...d.bankConfig, qrTemplate: e.target.value } }))}
            >
              <option value="compact">Nhỏ gọn (Compact)</option>
              <option value="qr_only">Chỉ có QR (QR Only)</option>
              <option value="print">Bản in (Print)</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
