import { useState } from 'react';
import type { AppData } from '../../data/store';
import { calculateRecommendedPrice } from '../../algorithms/forecasting';

interface PricingViewProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
const fmtCur = (n: number) => `${fmt(n)}đ`;

export default function PricingView({ data }: PricingViewProps) {
  const [ingredientCost, setIngredientCost] = useState(12000);
  const [labourPercent, setLabourPercent] = useState(25);
  const [overheadPercent, setOverheadPercent] = useState(15);
  const [targetFoodCost, setTargetFoodCost] = useState(28);
  const [vatPercent, setVatPercent] = useState(8);
  const [productName, setProductName] = useState('Cà phê Latte');
  const [competitorPrice, setCompetitorPrice] = useState<number | ''>('');

  const result = calculateRecommendedPrice(
    ingredientCost, labourPercent, overheadPercent, targetFoodCost, vatPercent
  );

  const marketPosition = competitorPrice
    ? result.recommendedPrice < +competitorPrice * 0.9 ? 'Thấp hơn thị trường'
    : result.recommendedPrice > +competitorPrice * 1.1 ? 'Cao hơn thị trường'
    : 'Cạnh tranh tốt'
    : null;

  const positionColor =
    marketPosition === 'Thấp hơn thị trường' ? 'var(--warning-text)' :
    marketPosition === 'Cao hơn thị trường' ? 'var(--danger-text)' :
    'var(--success-text)';

  return (
    <div className="page-content">
      <div className="grid-2">
        {/* Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 20 }}>🏷️ Tính giá bán thông minh</h3>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Tên sản phẩm</label>
              <input className="form-input" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Chi phí nguyên liệu (đ/phần)</label>
              <input className="form-input" type="number" value={ingredientCost}
                onChange={e => setIngredientCost(+e.target.value)}
                placeholder="VD: 12000" />
              <div style={{ marginTop: 6 }}>
                <input type="range" min="1000" max="100000" step="1000"
                  value={ingredientCost} onChange={e => setIngredientCost(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-500)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  <span>1,000đ</span><span>100,000đ</span>
                </div>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Target Food Cost % <span style={{ color: 'var(--primary-400)' }}>({targetFoodCost}%)</span></label>
                <input type="range" min="20" max="50" step="1"
                  value={targetFoodCost} onChange={e => setTargetFoodCost(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-500)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  <span>20% (cao cấp)</span><span>50% (bình dân)</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">VAT <span style={{ color: 'var(--info-text)' }}>({vatPercent}%)</span></label>
                <input type="range" min="0" max="15" step="1"
                  value={vatPercent} onChange={e => setVatPercent(+e.target.value)}
                  style={{ width: '100%', accentColor: '#3b82f6' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  <span>0%</span><span>15%</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Chi phí nhân công % <span style={{ color: 'var(--warning-text)' }}>({labourPercent}%)</span></label>
                <input type="range" min="10" max="40" step="1"
                  value={labourPercent} onChange={e => setLabourPercent(+e.target.value)}
                  style={{ width: '100%', accentColor: '#f59e0b' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Chi phí vận hành % <span style={{ color: 'var(--accent-violet)' }}>({overheadPercent}%)</span></label>
                <input type="range" min="5" max="30" step="1"
                  value={overheadPercent} onChange={e => setOverheadPercent(+e.target.value)}
                  style={{ width: '100%', accentColor: '#8b5cf6' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Giá đối thủ cạnh tranh (đ) — tùy chọn</label>
              <input className="form-input" type="number" value={competitorPrice}
                onChange={e => setCompetitorPrice(e.target.value ? +e.target.value : '')}
                placeholder="Nhập để so sánh..." />
            </div>
          </div>

          {/* Menu items comparison */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>📊 Phân tích giá thực đơn hiện tại</h3>
            <div className="table-container" style={{ border: 'none', maxHeight: 300 }}>
              <table>
                <thead>
                  <tr><th>Sản phẩm</th><th>Giá bán</th><th>Food Cost %</th><th>Đánh giá</th></tr>
                </thead>
                <tbody>
                  {data.menuItems.slice(0, 10).map(item => {
                    const fc = item.price > 0 ? (item.cost / item.price * 100) : 0;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.emoji} {item.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>{fmtCur(item.price)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <span className={`badge ${fc <= 28 ? 'badge-success' : fc <= 38 ? 'badge-warning' : 'badge-danger'}`}>{fc.toFixed(0)}%</span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {fc <= 28 ? '✅ Tốt' : fc <= 38 ? '⚠️ Chấp nhận được' : '🔴 Cần xem lại'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Result */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 20,
            padding: 28,
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Giá bán đề xuất cho</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              {productName}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>GIÁ BÁN TỐI ƯU</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-400)', fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
                {fmtCur(result.recommendedPrice)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                (Đã bao gồm VAT {vatPercent}%)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>Giá tối thiểu</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)' }}>
                  {fmtCur(result.minPrice)}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>Giá tối đa (heuristic)</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--info-text)', fontFamily: 'var(--font-mono)' }}>
                  {fmtCur(result.maxPrice)}
                </div>
              </div>
            </div>

            {/* Price range bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                <div style={{
                  position: 'absolute',
                  left: `${(result.minPrice / result.maxPrice) * 100}%`,
                  right: `${100 - (result.recommendedPrice / result.maxPrice) * 100}%`,
                  height: '100%',
                  background: 'var(--gradient-primary)',
                  borderRadius: 4,
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${(result.recommendedPrice / result.maxPrice) * 100}%`,
                  transform: 'translateX(-50%)',
                  width: 16, height: 16,
                  borderRadius: '50%',
                  background: 'var(--primary-500)',
                  border: '3px solid white',
                  top: -4,
                  boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                <span>Min: {fmtCur(result.minPrice)}</span>
                <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Đề xuất: {fmtCur(result.recommendedPrice)}</span>
                <span>Max: {fmtCur(result.maxPrice)}</span>
              </div>
            </div>

            {/* Market position */}
            {marketPosition && (
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8,
                marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>🏪 Vị thế thị trường</span>
                <span style={{ fontWeight: 700, color: positionColor, fontSize: '0.85rem' }}>{marketPosition}</span>
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>💸 Phân tích chi phí</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Chi phí nguyên liệu', value: ingredientCost, color: '#f43f5e', pct: targetFoodCost },
                { label: 'Chi phí nhân công', value: result.labourCost, color: '#f59e0b', pct: labourPercent },
                { label: 'Chi phí vận hành', value: result.overheadCost, color: '#8b5cf6', pct: overheadPercent },
                { label: 'VAT', value: result.recommendedPrice - Math.round(result.recommendedPrice / (1 + vatPercent / 100)), color: '#06b6d4', pct: vatPercent },
                { label: 'Lợi nhuận', value: result.recommendedPrice - ingredientCost - result.labourCost - result.overheadCost, color: '#10b981', pct: result.profitMargin },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: item.color }}>
                    {fmtCur(Math.max(0, item.value))}
                  </div>
                  <div style={{ width: 80 }}>
                    <div className="progress-bar-container" style={{ height: 6 }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.abs(item.pct))}%`, background: item.color }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', width: 35, textAlign: 'right' }}>
                    {item.pct.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px',
              background: `linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))`,
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Biên lợi nhuận</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                  {result.profitMargin}%
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                {result.profitMargin >= 25 ? '✅ Biên lợi nhuận tốt' :
                 result.profitMargin >= 15 ? '⚠️ Biên lợi nhuận chấp nhận được' :
                 '🔴 Biên lợi nhuận thấp — Cân nhắc tăng giá hoặc giảm chi phí'}
              </div>
            </div>
          </div>

          {/* Formula explanation */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 12 }}>📐 Công thức tính giá</h3>
            <div style={{
              padding: '14px', background: 'var(--bg-elevated)',
              borderRadius: 8, fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem', color: 'var(--accent-cyan)',
              lineHeight: 1.8,
            }}>
              <div>Giá cơ bản = Chi phí NL ÷ Food Cost%</div>
              <div style={{ color: 'var(--text-tertiary)' }}>= {fmtCur(ingredientCost)} ÷ {targetFoodCost}% = {fmtCur(Math.round(ingredientCost / (targetFoodCost/100)))}</div>
              <div style={{ marginTop: 8 }}>Giá bán = Giá cơ bản × (1 + VAT{vatPercent}%)</div>
              <div style={{ color: 'var(--text-tertiary)' }}>= {fmtCur(result.recommendedPrice)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
