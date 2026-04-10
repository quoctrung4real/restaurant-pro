import { useState } from 'react';
import type { AppData } from '../../data/store';
import type { AdminUser, LoginLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AuthViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
  onLoginSuccess: (user: AdminUser) => void;
  onClose: () => void;
}

export default function AuthView({ data, updateData, onLoginSuccess, onClose }: AuthViewProps) {
  const [isLoginWalkthrough, setIsLoginWalkthrough] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = data.users.find(u => u.username === username && u.passwordHash === password);
    
    // Log attempt
    const newLog: LoginLog = {
      id: uuidv4(),
      userId: user?.id || 'unknown',
      username,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // Mock
      device: navigator.userAgent,
      status: user && user.status === 'approved' ? 'success' : 'failed'
    };

    updateData(d => ({ ...d, loginLogs: [newLog, ...d.loginLogs] }));

    if (!user) {
      setError('Sai tên đăng nhập hoặc mật khẩu!');
      return;
    }

    if (user.status === 'pending') {
      setError('Tài khoản của bạn đang chờ Super Admin phê duyệt!');
      return;
    }

    if (user.status === 'rejected') {
      setError('Tài khoản của bạn đã bị từ chối truy cập!');
      return;
    }

    // Update last login
    updateData(d => ({
      ...d,
      users: d.users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u)
    }));

    onLoginSuccess(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (data.users.some(u => u.username === username)) {
      setError('Tên đăng nhập đã tồn tại!');
      return;
    }

    if (username.length < 3 || password.length < 6) {
      setError('Tên đăng nhập >= 3 ký tự, mật khẩu >= 6 ký tự.');
      return;
    }

    const newUser: AdminUser = {
      id: uuidv4(),
      username,
      passwordHash: password,
      fullName,
      role: 'admin',      // Default role
      status: 'pending',  // Must be approved by superadmin
      createdAt: new Date().toISOString(),
    };

    updateData(d => ({ ...d, users: [...d.users, newUser] }));
    setSuccessMsg('Đăng ký thành công! Vui lòng đợi phê duyệt.');
    setUsername('');
    setPassword('');
    setFullName('');
    setTimeout(() => setIsLoginWalkthrough(true), 2000);
  };

  return (
    <div className="auth-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: 400, position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 20 }}
        >
          ✕
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32 }}>🔐</span>
          {isLoginWalkthrough ? 'Đăng nhập Quản trị' : 'Đăng ký Quản trị viên'}
        </h2>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}
        {successMsg && <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{successMsg}</div>}

        <form onSubmit={isLoginWalkthrough ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLoginWalkthrough && (
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input 
                className="form-input" required
                value={fullName} onChange={e => setFullName(e.target.value)} 
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input 
              className="form-input" required
              value={username} onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input 
              className="form-input" type="password" required
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: '12px' }}>
            {isLoginWalkthrough ? 'Đăng Nhập' : 'Gửi Yêu Cầu Đăng Ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLoginWalkthrough ? (
            <>Chưa có tài khoản? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => { setIsLoginWalkthrough(false); setError(''); }}>Đăng ký ngay</span></>
          ) : (
            <>Đã có tài khoản? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => { setIsLoginWalkthrough(true); setError(''); }}>Đăng nhập</span></>
          )}
        </div>
      </div>
    </div>
  );
}
