import type { AppData } from '../../data/store';

interface HeaderProps {
  title: string;
  desc: string;
  data: AppData;
}

export default function Header({ title, desc }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="header">
      <div className="header-title">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <div className="header-actions">
        <span className="header-date">
          {dateStr} — {timeStr}
        </span>
        <button className="header-btn" title="Thông báo">🔔</button>
        <button className="header-btn" title="Tài khoản">👤</button>
      </div>
    </header>
  );
}
