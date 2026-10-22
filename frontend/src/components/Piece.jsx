import React from 'react';

export default function Piece({
  piece,
  isSelected,
  isInCheck,
  showVietnamese = true,
  onClick
}) {
  if (!piece) return null;

  const isRed = piece.color === 'Red';
  const pieceClass = `xiangqi-piece ${isRed ? 'piece-red' : 'piece-black'} ${isSelected ? 'selected' : ''} ${isInCheck ? 'king-in-check' : ''}`;

  // Helper to format short uppercase Vietnamese piece name
  const getShortVietName = (type, color) => {
    switch (type) {
      case 'King': return color === 'Red' ? 'SOÁI' : 'TƯỚNG';
      case 'Advisor': return 'SĨ';
      case 'Elephant': return 'TƯỢNG';
      case 'Horse': return 'MÃ';
      case 'Rook': return 'XE';
      case 'Cannon': return 'PHÁO';
      case 'Pawn': return color === 'Red' ? 'BINH' : 'TỐT';
      default: return 'QUÂN';
    }
  };

  const vietName = getShortVietName(piece.type, piece.color);
  const mainText = showVietnamese ? vietName : piece.character;
  const subText = showVietnamese ? piece.character : piece.vietnameseName.split(' ')[0];

  return (
    <div
      className={pieceClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`${piece.vietnameseName} (${piece.color === 'Red' ? 'Đỏ' : 'Đen'}) - Ký tự Hán: ${piece.character}`}
    >
      <div className="piece-inner-ring" />
      <span className={`piece-char ${showVietnamese ? 'piece-char-viet' : 'piece-char-han'}`}>
        {mainText}
      </span>
      <span className="piece-sub">{subText}</span>
    </div>
  );
}
