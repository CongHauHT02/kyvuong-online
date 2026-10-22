import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, Medal } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function LeaderboardModal({ isOpen, onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLeaderboard();
      setLeaders(data || []);
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ width: 'min(94vw, 560px)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Trophy size={22} color="#ffd700" />
            <h2>Bảng Xếp Hạng Kỳ Thủ</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={fetchLeaders} disabled={loading} title="Làm mới">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {leaders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#887' }}>
              {loading ? 'Đang tải dữ liệu...' : 'Chưa có kỳ thủ nào trong bảng xếp hạng. Hãy đăng ký và thi đấu ngay!'}
            </div>
          ) : (
            <table className="move-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>Hạng</th>
                  <th>Kỳ Thủ</th>
                  <th style={{ textAlign: 'center' }}>Kỳ Lực (Elo)</th>
                  <th style={{ textAlign: 'center' }}>T/B/H</th>
                  <th style={{ textAlign: 'right' }}>Thắng %</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((u, idx) => {
                  const rank = idx + 1;
                  const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#e2e8f0' : rank === 3 ? '#cd7f32' : '#a89a8c';

                  return (
                    <tr key={u.id}>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: rankColor, fontSize: '0.95rem' }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f3ece4' }}>{u.displayName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#887' }}>@{u.username}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#ffd700' }}>
                        {u.eloRating}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <span style={{ color: '#10b981' }}>{u.wins}</span>/
                        <span style={{ color: '#ef4444' }}>{u.losses}</span>/
                        <span style={{ color: '#94a3b8' }}>{u.draws}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: u.winRate >= 50 ? '#10b981' : '#f59e0b' }}>
                        {u.winRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
