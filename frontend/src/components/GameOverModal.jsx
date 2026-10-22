import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, XCircle, ClockAlert, Award } from 'lucide-react';
import { audio } from '../services/audioService';

export default function GameOverModal({
  status,
  winner,
  userColor,
  onNewGame,
  onRematch
}) {
  const isOver = ['Checkmate', 'Stalemate', 'Resigned', 'Draw', 'Timeout'].includes(status);

  useEffect(() => {
    if (!isOver) return;

    const isWinner = winner && (!userColor || winner === userColor);
    if (isWinner) {
      audio.playVictorySound();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      audio.playDefeatSound();
    }
  }, [isOver, winner, userColor]);

  if (!isOver) return null;

  const isDraw = status === 'Draw';
  const isWinner = winner && (!userColor || winner === userColor);
  const winnerText = winner === 'Red'
    ? 'QUÂN ĐỎ THẮNG CUỘC'
    : winner === 'Black'
    ? 'QUÂN ĐEN THẮNG CUỘC'
    : 'HÒA CỜ';

  const reasonText = status === 'Checkmate'
    ? 'Chiếu bí! Đối phương không còn nước cản.'
    : status === 'Stalemate'
    ? 'Vây bí! Đối phương không còn nước đi hợp lệ.'
    : status === 'Resigned'
    ? 'Đối thủ đã xin nhận thua.'
    : status === 'Timeout'
    ? 'Hết giờ thi đấu! Kỳ thủ đã cạn kiệt thời gian (Rụng kim) và bị xử thua theo Luật Cờ Tướng Quốc Tế (WXF).'
    : 'Hai bên đồng ý bắt tay giảng hòa.';

  const pointsText = isDraw
    ? '+1 Điểm (Hòa Trận)'
    : isWinner
    ? '+2 Điểm (Chiến Thắng)'
    : '0 Điểm (Thất Bại)';

  const pointsColor = isDraw ? '#ffd700' : isWinner ? '#10b981' : '#ef4444';

  return (
    <div className="modal-backdrop" style={{ zIndex: 120 }}>
      <div className="modal-content" style={{ textAlign: 'center', padding: '2.5rem 1.75rem', maxWidth: '460px' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '1.1rem',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.15)',
            marginBottom: '1rem',
            border: '2px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          {status === 'Timeout' ? (
            <ClockAlert size={54} color="#f59e0b" />
          ) : isDraw ? (
            <XCircle size={54} color="#a89a8c" />
          ) : (
            <Trophy size={54} color="#ffd700" />
          )}
        </div>

        <h2
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: winner === 'Red' ? '#ef4444' : winner === 'Black' ? '#ffd700' : '#d1c5b8',
            marginBottom: '0.4rem',
            letterSpacing: '1px'
          }}
        >
          {winnerText}
        </h2>

        <p style={{ color: '#d1c5b8', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
          {reasonText}
        </p>

        {/* International Tournament Score Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(15, 12, 9, 0.85)',
            border: `1px solid ${pointsColor}`,
            borderRadius: '25px',
            marginBottom: '1.75rem',
            boxShadow: `0 0 15px ${pointsColor}33`
          }}
        >
          <Award size={18} color={pointsColor} />
          <span style={{ fontSize: '0.82rem', color: '#a89a8c' }}>Điểm Giải Quốc Tế:</span>
          <strong style={{ fontSize: '0.95rem', color: pointsColor }}>{pointsText}</strong>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-gold"
            style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 700 }}
            onClick={onRematch || onNewGame}
          >
            <RefreshCw size={18} />
            <span>Đấu Lại Ván Này</span>
          </button>

          <button
            type="button"
            className="btn btn-dark"
            style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}
            onClick={onNewGame}
          >
            <span>Ván Mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
