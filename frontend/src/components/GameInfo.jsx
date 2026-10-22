import React from 'react';
import { ShieldAlert } from 'lucide-react';

const PIECE_VALUES = {
  King: 1000,
  Rook: 90,
  Cannon: 45,
  Horse: 40,
  Advisor: 20,
  Elephant: 20,
  Pawn: 10
};

export default function GameInfo({
  gameState,
  redPlayerName = 'Kỳ Thủ Đỏ',
  blackPlayerName = 'Kỳ Thủ Đen'
}) {
  if (!gameState) return null;

  const isRedTurn = gameState.currentTurn === 'Red';

  // Calculate material difference
  const calcScore = (pieces = []) =>
    pieces.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0);

  const redLostScore = calcScore(gameState.capturedRedPieces);
  const blackLostScore = calcScore(gameState.capturedBlackPieces);
  const diff = blackLostScore - redLostScore; // Positive means Red advantage

  return (
    <div className="dashboard-card">
      {/* Turn Banner */}
      <div className="turn-banner">
        <div className="turn-player">
          <div className={`turn-badge ${isRedTurn ? 'red' : 'black'}`}>
            {isRedTurn ? '帥' : '將'}
          </div>
          <div className="turn-info">
            <h3>{isRedTurn ? redPlayerName : blackPlayerName}</h3>
            <p>
              Lượt {gameState.fullmoveNumber} • Quân {isRedTurn ? 'Đỏ' : 'Đen'} đi
            </p>
          </div>
        </div>

        {gameState.inCheck && (
          <div className="check-pill">
            <ShieldAlert size={14} />
            <span>CHIẾU TƯỚNG!</span>
          </div>
        )}
      </div>

      {/* Material Balance Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#a89a8c',
          marginBottom: '0.75rem',
          padding: '0 0.25rem'
        }}
      >
        <span>So sánh thế trận:</span>
        <span style={{ fontWeight: 700, color: diff > 0 ? '#ef4444' : diff < 0 ? '#fef08a' : '#d4af37' }}>
          {diff > 0 ? `Đỏ chiếm ưu (+${diff})` : diff < 0 ? `Đen chiếm ưu (+${Math.abs(diff)})` : 'Cân bằng thế cờ'}
        </span>
      </div>

      {/* Captured Pieces Cemetery */}
      <div className="captured-panel">
        {/* Black pieces captured by Red */}
        <div className="captured-row">
          <span className="captured-label">Ăn được:</span>
          <div className="captured-list">
            {gameState.capturedBlackPieces?.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#665' }}>Chưa có</span>
            ) : (
              gameState.capturedBlackPieces?.map((p, idx) => (
                <div key={`c-b-${idx}`} className="mini-piece black" title={p.vietnameseName}>
                  {p.character}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Red pieces captured by Black */}
        <div className="captured-row">
          <span className="captured-label">Bị mất:</span>
          <div className="captured-list">
            {gameState.capturedRedPieces?.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: '#665' }}>Chưa có</span>
            ) : (
              gameState.capturedRedPieces?.map((p, idx) => (
                <div key={`c-r-${idx}`} className="mini-piece red" title={p.vietnameseName}>
                  {p.character}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
