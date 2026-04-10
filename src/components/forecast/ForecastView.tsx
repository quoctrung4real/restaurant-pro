import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import type { AppData } from '../../data/store';
import { generateForecastReport } from '../../algorithms/forecasting';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ForecastViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function ForecastView({ data }: ForecastViewProps) {
  const [horizon, setHorizon] = useState<7 | 30 | 90>(30);

  const report = useMemo(() => {
    return generateForecastReport(data.revenues, horizon);
  }, [data.revenues, horizon]);

  // Build chart: historical (last 60 days with data) + forecast
  const sortedRevenues = [...data.revenues]
    .filter(r => r.amount > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const historical = sortedRevenues.slice(-60);

  const historicalLabels = historical.map(r => {
    const d = new Date(r.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const forecastLabels = report.dailyForecasts.map(fc => {
    const d = new Date(fc.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const allLabels = [...historicalLabels, ...forecastLabels];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Doanh thu thực tế',
        data: [...historical.map(r => r.amount), ...new Array(forecastLabels.length).fill(null)],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2,
      },
      {
        label: 'Dự báo (Ensemble)',
        data: [...new Array(historicalLabels.length).fill(null), ...report.dailyForecasts.map(f => f.predicted)],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.07)',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
        borderDash: [5, 3],
      },
      {
        label: 'Giới hạn trên (95% CI)',
        data: [...new Array(historicalLabels.length).fill(null), ...report.dailyForecasts.map(f => f.upper)],
        borderColor: 'rgba(16,185,129,0.25)',
        backgroundColor: 'rgba(16,185,129,0.06)',
        fill: '+1',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: 'Giới hạn dưới (95% CI)',
        data: [...new Array(historicalLabels.length).fill(null), ...report.dailyForecasts.map(f => f.lower)],
        borderColor: 'rgba(16,185,129,0.25)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1,
      },
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.5)', font: { size: 11 }, filter: (item: any) => !item.text.includes('Giới hạn') }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            if (ctx.raw == null) return '';
            return `${ctx.dataset.label}: ${fmtCur(ctx.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, maxTicksLimit: 20 },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 10 },
          callback: (v: any) => `${(v / 1_000_000).toFixed(1)}M`
        },
        border: { display: false },
      }
    }
  };

  const riskColors = {
    low: 'var(--success-text)',
    medium: 'var(--warning-text)',
    high: 'var(--danger-text)',
  };

  const riskLabels = {
    low: '🟢 Thấp',
    medium: '🟡 Trung bình',
    high: '🔴 Cao',
  };

  return (
    <div className="page-content">
      {/* Header with horizon selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            🔮 Dự báo doanh thu AI
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            Phân tích {data.revenues.length} ngày dữ liệu • Ensemble: Holt-Winters + WMA + Linear Reg + STL
          </p>
        </div>
        <div className="tabs">
          {([7, 30, 90] as const).map(h => (
            <button
              key={h}
              className={`tab-btn ${horizon === h ? 'active' : ''}`}
              onClick={() => setHorizon(h)}
            >
              {h} ngày
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card success">
          <div className="kpi-icon green" style={{ marginBottom: 8 }}>📈</div>
          <div className="kpi-value">{fmtCur(report.monthlyTotal)}</div>
          <div className="kpi-label">Dự báo {horizon} ngày tới</div>
          <div className="kpi-sub">TB/ngày: {fmtCur(report.monthlyTotal / horizon)}</div>
        </div>

        <div className={`kpi-card ${report.growthRate >= 0 ? 'success' : 'danger'}`}>
          <div className={`kpi-icon ${report.growthRate >= 0 ? 'green' : 'rose'}`} style={{ marginBottom: 8 }}>
            {report.growthRate >= 0 ? '↗️' : '↘️'}
          </div>
          <div className="kpi-value" style={{ color: report.growthRate >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
            {report.growthRate >= 0 ? '+' : ''}{report.growthRate.toFixed(1)}%
          </div>
          <div className="kpi-label">Tốc độ tăng trưởng dự báo</div>
          <div className="kpi-sub">So với {horizon} ngày trước</div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-icon blue" style={{ marginBottom: 8 }}>🎯</div>
          <div className="kpi-value">{report.confidence}%</div>
          <div className="kpi-label">Độ tin cậy mô hình</div>
          <div style={{ marginTop: 8 }}>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{
                width: `${report.confidence}%`,
                background: report.confidence >= 80 ? 'var(--gradient-success)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }} />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon amber" style={{ marginBottom: 8 }}>⚠️</div>
          <div className="kpi-value" style={{ color: riskColors[report.riskLevel], fontSize: '1.2rem' }}>
            {riskLabels[report.riskLevel]}
          </div>
          <div className="kpi-label">Mức độ rủi ro</div>
          <div className="kpi-sub">Ngày cao điểm: {report.peakDays.join(', ')}</div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="chart-container" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <h3 className="section-title">
            <span className="icon">📊</span>
            Biểu đồ dự báo với khoảng tin cậy 95%
          </h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
              <span style={{ width: 16, height: 2, background: '#f97316', display: 'inline-block', borderRadius: 1 }}></span>
              Thực tế
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
              <span style={{ width: 16, height: 2, display: 'inline-block', borderRadius: 1, borderTop: '2px dashed #10b981', background: 'none' }}></span>
              Dự báo
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
              <span style={{ width: 16, height: 8, background: 'rgba(16,185,129,0.15)', display: 'inline-block', borderRadius: 2, border: '1px solid rgba(16,185,129,0.3)' }}></span>
              Khoảng tin cậy
            </span>
          </div>
        </div>
        <div className="chart-wrapper" style={{ height: 320 }}>
          <Line data={chartData} options={chartOptions as any} />
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 16 }}>
            💡 Khuyến nghị thông minh
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {report.recommendations.map((rec, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                {rec}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 16 }}>
            📅 Phân tích ngày trong tuần
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(249,115,22,0.1)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Ngày cao điểm 🔥</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                {report.peakDays.join(' & ')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                → Chuẩn bị thêm nhân lực và nguyên liệu
              </div>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Ngày thấp điểm 📉</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--info-text)' }}>
                {report.lowDays.join(' & ')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                → Tốt để bảo trì thiết bị & tập huấn nhân viên
              </div>
            </div>
          </div>

          {/* Model info */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase' }}>
              Mô hình Ensemble sử dụng
            </div>
            {['🔹 Weighted Moving Average (WMA)', '🔹 Holt-Winters Triple Exponential Smoothing', '🔹 Linear Regression với điều chỉnh mùa vụ', '🔹 Seasonal Decomposition (STL-like)'].map((m, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                {m}
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              Trọng số tự động điều chỉnh theo MAPE (Mean Absolute Percentage Error)
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="chart-container">
        <h3 className="section-title" style={{ marginBottom: 16 }}>📋 Chi tiết dự báo từng ngày</h3>
        <div className="table-container" style={{ border: 'none', maxHeight: 400, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Thứ</th>
                <th>Dự báo doanh thu</th>
                <th>Giới hạn dưới</th>
                <th>Giới hạn trên</th>
                <th>Khoảng biến động</th>
              </tr>
            </thead>
            <tbody>
              {report.dailyForecasts.map((fc, i) => {
                const d = new Date(fc.date);
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const dow = d.getDay();
                const isWeekend = dow === 0 || dow === 6;
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fc.date}</td>
                    <td>
                      <span className={`badge ${isWeekend ? 'badge-primary' : 'badge-neutral'}`}>
                        {dayNames[dow]}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success-text)' }}>
                      {fmtCur(fc.predicted)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {fmtCur(fc.lower)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {fmtCur(fc.upper)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning-text)', fontSize: '0.78rem' }}>
                      ±{fmtCur((fc.upper - fc.lower) / 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
