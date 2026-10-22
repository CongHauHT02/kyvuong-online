import React, { useEffect, useRef } from 'react';
import { History } from 'lucide-react';

export default function MoveHistory({ moveHistory = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory]);

  // Group moves into pairs (Red move, Black move)
  const groupedMoves = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    groupedMoves.push({
      round: Math.floor(i / 2) + 1,
      red: moveHistory[i],
      black: moveHistory[i + 1] || null
    });
  }

  return (
    <div className="dashboard-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#d4af37',
          marginBottom: '0.75rem'
        }}
      >
        <History size={16} />
        <span>Biên Bản Ván Cờ ({moveHistory.length} nước)</span>
      </div>

      <div className="move-history-card" ref={scrollRef}>
        {groupedMoves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#776', fontSize: '0.8rem' }}>
            Ván cờ chưa bắt đầu nước đi nào.
          </div>
        ) : (
          <table className="move-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>STT</th>
                <th>Bên Đỏ</th>
                <th>Bên Đen</th>
              </tr>
            </thead>
            <tbody>
              {groupedMoves.map(g => (
                <tr key={`round-${g.round}`}>
                  <td className="move-num">{g.round}.</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>
                    {g.red ? (
                      <span title={g.red.piece.vietnameseName}>
                        {g.red.notation || `${g.red.piece.vietnameseName} (${g.red.from.row},${g.red.from.col})`}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ color: '#fef08a', fontWeight: 600 }}>
                    {g.black ? (
                      <span title={g.black.piece.vietnameseName}>
                        {g.black.notation || `${g.black.piece.vietnameseName} (${g.black.from.row},${g.black.from.col})`}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
