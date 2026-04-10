import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppData } from '../../data/store';
import type { Employee } from '../../types';

interface StaffViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

const roleNames: Record<string, string> = {
  manager: '👔 Quản lý',
  chef: '👨‍🍳 Bếp trưởng',
  waiter: '🥢 Phục vụ',
  cashier: '💰 Thu ngân',
  other: '👤 Khác',
};

export default function StaffView({ data, updateData }: StaffViewProps) {
  const [tab, setTab] = useState<'list' | 'attendance' | 'payroll'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Partial<Employee> | null>(null);

  const active = data.employees.filter(e => e.status === 'active');
  const totalSalary = active.reduce((s, e) => s + e.hourlyWage * 8 * 26, 0);

  const openAdd = () => {
    setEditEmp({ id: uuidv4(), name: '', role: 'waiter', hourlyWage: 35000, startDate: new Date().toISOString().split('T')[0], status: 'active' });
    setShowModal(true);
  };

  const saveEmp = () => {
    if (!editEmp?.name) return;
    const emp = editEmp as Employee;
    updateData(prev => {
      const exists = prev.employees.find(e => e.id === emp.id);
      if (exists) return { ...prev, employees: prev.employees.map(e => e.id === emp.id ? emp : e) };
      return { ...prev, employees: [...prev.employees, emp] };
    });
    setShowModal(false);
  };

  const today = new Date().toISOString().split('T')[0];

  // Simulate attendance for today
  const todayAttendances = data.attendances.filter(a => a.date === today);

  const checkIn = (empId: string) => {
    const existing = todayAttendances.find(a => a.employeeId === empId);
    if (existing) return;
    updateData(prev => ({
      ...prev,
      attendances: [...prev.attendances, {
        id: uuidv4(),
        employeeId: empId,
        date: today,
        checkIn: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }]
    }));
  };

  const checkOut = (empId: string) => {
    const record = todayAttendances.find(a => a.employeeId === empId && !a.checkOut);
    if (!record) return;
    const checkInTime = record.checkIn || '08:00';
    const [inH, inM] = checkInTime.split(':').map(Number);
    const now = new Date();
    const hoursWorked = ((now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM)) / 60;

    updateData(prev => ({
      ...prev,
      attendances: prev.attendances.map(a =>
        a.id === record.id ? {
          ...a,
          checkOut: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          hoursWorked: Math.max(0, hoursWorked),
        } : a
      )
    }));
  };

  // Payroll calculation
  const payroll = useMemo(() => {
    return data.employees.filter(e => e.status === 'active').map(emp => {
      const records = data.attendances.filter(a => a.employeeId === emp.id);
      const totalHours = records.reduce((s, a) => s + (a.hoursWorked || 8), 0);
      const baseSalary = emp.hourlyWage * 8 * 26;
      const overtimeHours = Math.max(0, totalHours - 208); // 8h * 26 days
      const overtimePay = overtimeHours * emp.hourlyWage * 1.5;
      const totalPay = baseSalary + overtimePay;
      return { emp, totalHours, baseSalary, overtimeHours, overtimePay, totalPay };
    });
  }, [data]);

  return (
    <div className="page-content">
      {showModal && editEmp && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {data.employees.find(e => e.id === editEmp.id) ? '✏️ Sửa' : '➕ Thêm'} nhân viên
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Họ tên *</label>
                <input className="form-input" value={editEmp.name || ''} onChange={e => setEditEmp(p => ({ ...p, name: e.target.value }))} placeholder="Nguyễn Văn A" />
              </div>
              <div className="form-group">
                <label className="form-label">Chức vụ</label>
                <select className="form-select" value={editEmp.role || 'waiter'} onChange={e => setEditEmp(p => ({ ...p, role: e.target.value as Employee['role'] }))}>
                  <option value="manager">👔 Quản lý</option>
                  <option value="chef">👨‍🍳 Bếp trưởng</option>
                  <option value="waiter">🥢 Phục vụ</option>
                  <option value="cashier">💰 Thu ngân</option>
                  <option value="other">👤 Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lương theo giờ (đ)</label>
                <input className="form-input" type="number" value={editEmp.hourlyWage || ''} onChange={e => setEditEmp(p => ({ ...p, hourlyWage: +e.target.value }))} placeholder="35000" />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" value={editEmp.phone || ''} onChange={e => setEditEmp(p => ({ ...p, phone: e.target.value }))} placeholder="0901234567" />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày vào làm</label>
                <input className="form-input" type="date" value={editEmp.startDate || ''} onChange={e => setEditEmp(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={editEmp.status || 'active'} onChange={e => setEditEmp(p => ({ ...p, status: e.target.value as Employee['status'] }))}>
                  <option value="active">✅ Đang làm</option>
                  <option value="inactive">⛔ Nghỉ việc</option>
                </select>
              </div>
            </div>
            {editEmp.hourlyWage && (
              <div className="pricing-result" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Lương tháng ước tính (8h × 26 ngày)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
                  {fmtCur(editEmp.hourlyWage * 8 * 26)}
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={saveEmp}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { icon: '👥', label: 'Tổng nhân viên', value: data.employees.length, color: 'blue' },
          { icon: '✅', label: 'Đang làm việc', value: active.length, color: 'green' },
          { icon: '💰', label: 'Lương tháng ước tính', value: fmtCur(totalSalary), color: 'orange', isCur: true },
          { icon: '📅', label: 'Chấm công hôm nay', value: `${todayAttendances.length}/${active.length}`, color: 'violet' },
        ].map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className={`kpi-icon ${k.color}`} style={{ marginBottom: 8 }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tabs">
          {([['list', '📋 Danh sách'], ['attendance', '⏰ Chấm công'], ['payroll', '💸 Bảng lương']] as const).map(([id, label]) => (
            <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        {tab === 'list' && (
          <button className="btn btn-primary" onClick={openAdd}>➕ Thêm nhân viên</button>
        )}
      </div>

      {tab === 'list' && (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nhân viên</th><th>Chức vụ</th><th>Lương/giờ</th><th>Lương tháng TB</th><th>Ngày vào</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {data.employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid var(--border-default)' }}>
                        {emp.role === 'manager' ? '👔' : emp.role === 'chef' ? '👨‍🍳' : emp.role === 'cashier' ? '💰' : '🥢'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{emp.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{roleNames[emp.role]}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>{fmtCur(emp.hourlyWage)}/h</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtCur(emp.hourlyWage * 8 * 26)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.startDate}</td>
                  <td>
                    <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status === 'active' ? '✅ Đang làm' : '⛔ Nghỉ việc'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => { setEditEmp({ ...emp }); setShowModal(true); }}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nhân viên</th><th>Chức vụ</th><th>Giờ vào</th><th>Giờ ra</th><th>Số giờ làm</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {active.map(emp => {
                const record = todayAttendances.find(a => a.employeeId === emp.id);
                return (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</td>
                    <td><span className="badge badge-neutral">{roleNames[emp.role]}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: record?.checkIn ? 'var(--success-text)' : 'var(--text-tertiary)' }}>
                      {record?.checkIn || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: record?.checkOut ? 'var(--info-text)' : 'var(--text-tertiary)' }}>
                      {record?.checkOut || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {record?.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => checkIn(emp.id)} disabled={!!record}>
                          ▶ Check-in
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => checkOut(emp.id)} disabled={!record || !!record.checkOut}>
                          ⏹ Check-out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nhân viên</th><th>Giờ làm</th><th>Lương cơ bản</th><th>Phụ cấp OT</th><th>Tổng nhận</th></tr>
            </thead>
            <tbody>
              {payroll.map(({ emp, totalHours, baseSalary, overtimeHours, overtimePay, totalPay }) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{totalHours.toFixed(0)}h (OT: {overtimeHours.toFixed(0)}h)</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtCur(baseSalary)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: overtimePay > 0 ? 'var(--warning-text)' : 'var(--text-tertiary)' }}>
                    {overtimePay > 0 ? `+${fmtCur(overtimePay)}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-400)', fontSize: '0.95rem' }}>
                    {fmtCur(totalPay)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <td colSpan={4} style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '12px 16px' }}>
                  TỔNG CHI PHÍ NHÂN SỰ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-400)', fontSize: '1.1rem', padding: '12px 16px' }}>
                  {fmtCur(payroll.reduce((s, p) => s + p.totalPay, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
