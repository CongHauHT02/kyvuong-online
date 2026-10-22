import React from 'react';
import Piece from './Piece';

export default function Board({
  gameState,
  selectedPos,
  validMoves = [],
  lastMove = null,
  isFlipped = false,
  showVietnamese = true,
  onSquareClick
}) {
  if (!gameState || !gameState.board) return null;

  // Render 10 rows x 9 cols
  const rows = isFlipped ? [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const cols = isFlipped ? [8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  // Helper to check valid move
  const isValidDest = (r, c) => validMoves.some(m => m.row === r && m.col === c);

  return (
    <div className="board-wrapper">
      <div className="board-outer-frame">
        <div className="xiangqi-board">
          {/* SVG Board Lines & Markings */}
          <svg className="board-svg-grid" viewBox="0 0 900 1000" preserveAspectRatio="none">
            <defs>
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer Boundary Frame */}
            <rect x="42" y="42" width="816" height="916" fill="none" stroke="#5a381e" strokeWidth="4" />
            <rect x="48" y="48" width="804" height="904" fill="none" stroke="#d4af37" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* 10 Horizontal Lines */}
            {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map((y, idx) => (
              <line key={`h-${idx}`} x1="50" y1={y} x2="850" y2={y} stroke="#5a381e" strokeWidth="2.2" />
            ))}

            {/* Left and Right full Vertical Border lines */}
            <line x1="50" y1="50" x2="50" y2="950" stroke="#5a381e" strokeWidth="2.2" />
            <line x1="850" y1="50" x2="850" y2="950" stroke="#5a381e" strokeWidth="2.2" />

            {/* Inner Vertical Lines (broken at River) */}
            {[150, 250, 350, 450, 550, 650, 750].map((x, idx) => (
              <g key={`v-${idx}`}>
                {/* Top Half */}
                <line x1={x} y1="50" x2={x} y2="450" stroke="#5a381e" strokeWidth="2.2" />
                {/* Bottom Half */}
                <line x1={x} y1="550" x2={x} y2="950" stroke="#5a381e" strokeWidth="2.2" />
              </g>
            ))}

            {/* Palaces Diagonal Cross Lines (Cửu Cung) */}
            {/* Top Palace */}
            <line x1="350" y1="50" x2="550" y2="250" stroke="#5a381e" strokeWidth="2" strokeDasharray="none" />
            <line x1="550" y1="50" x2="350" y2="250" stroke="#5a381e" strokeWidth="2" strokeDasharray="none" />

            {/* Bottom Palace */}
            <line x1="350" y1="750" x2="550" y2="950" stroke="#5a381e" strokeWidth="2" strokeDasharray="none" />
            <line x1="550" y1="750" x2="350" y2="950" stroke="#5a381e" strokeWidth="2" strokeDasharray="none" />

            {/* River River Calligraphy Watermark (Sở Hà - Hán Giới) */}
            <g opacity="0.65">
              <text
                x="220"
                y="512"
                fontFamily="Noto Serif TC, serif"
                fontSize="36"
                fontWeight="bold"
                fill="#8c6d1f"
                textAnchor="middle"
                letterSpacing="12"
              >
                楚 河
              </text>
              <text
                x="680"
                y="512"
                fontFamily="Noto Serif TC, serif"
                fontSize="36"
                fontWeight="bold"
                fill="#8c6d1f"
                textAnchor="middle"
                letterSpacing="12"
              >
                漢 界
              </text>
              <text
                x="450"
                y="508"
                fontFamily="Outfit, sans-serif"
                fontSize="13"
                fontWeight="600"
                fill="#aa7c11"
                textAnchor="middle"
                letterSpacing="4"
                opacity="0.8"
              >
                SỞ HÀ • HÁN GIỚI
              </text>
            </g>

            {/* Star Points / Corner Marks (Pháo & Tốt) */}
            {[
              [2, 1], [2, 7], // Cannons top
              [7, 1], [7, 7], // Cannons bottom
              [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // Pawns top
              [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]  // Pawns bottom
            ].map(([r, c], idx) => {
              const cx = 50 + c * 100;
              const cy = 50 + r * 100;
              const d = 6;
              const len = 12;

              return (
                <g key={`star-${idx}`} stroke="#784e28" strokeWidth="1.8" opacity="0.85">
                  {/* Top-Left */}
                  {c > 0 && (
                    <path d={`M ${cx - d - len} ${cy - d} L ${cx - d} ${cy - d} L ${cx - d} ${cy - d - len}`} fill="none" />
                  )}
                  {/* Top-Right */}
                  {c < 8 && (
                    <path d={`M ${cx + d + len} ${cy - d} L ${cx + d} ${cy - d} L ${cx + d} ${cy - d - len}`} fill="none" />
                  )}
                  {/* Bottom-Left */}
                  {c > 0 && (
                    <path d={`M ${cx - d - len} ${cy + d} L ${cx - d} ${cy + d} L ${cx - d} ${cy + d + len}`} fill="none" />
                  )}
                  {/* Bottom-Right */}
                  {c < 8 && (
                    <path d={`M ${cx + d + len} ${cy + d} L ${cx + d} ${cy + d} L ${cx + d} ${cy + d + len}`} fill="none" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Pieces & Highlight Grid */}
          <div className="board-pieces-layer">
            {rows.map(r =>
              cols.map(c => {
                const piece = gameState.board[r]?.[c];
                const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                const isDestination = isValidDest(r, c);
                const hasEnemyPiece = piece && piece.color !== gameState.currentTurn;

                const isLastOrigin = lastMove && lastMove.from.row === r && lastMove.from.col === c;
                const isLastDest = lastMove && lastMove.to.row === r && lastMove.to.col === c;

                const isInCheck = piece && piece.type === 'King' && gameState.inCheck &&
                  gameState.inCheckKingPos?.row === r && gameState.inCheckKingPos?.col === c;

                return (
                  <div
                    key={`cell-${r}-${c}`}
                    className="board-intersection"
                    onClick={() => onSquareClick(r, c)}
                  >
                    {/* Last Move Origin Marker */}
                    {isLastOrigin && <div className="last-move-origin" />}

                    {/* Last Move Destination Glow */}
                    {isLastDest && <div className="last-move-dest" />}

                    {/* Valid Move Indicator Dot */}
                    {isDestination && !piece && (
                      <div className="valid-move-indicator" />
                    )}

                    {/* Capture Target Ring on Enemy Piece */}
                    {isDestination && piece && hasEnemyPiece && (
                      <div className="capture-target-indicator" />
                    )}

                    {/* The 3D Piece */}
                    {piece && (
                      <Piece
                        piece={piece}
                        isSelected={isSelected}
                        isInCheck={isInCheck}
                        showVietnamese={showVietnamese}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
