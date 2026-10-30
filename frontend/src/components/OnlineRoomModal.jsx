import React, { useState, useEffect } from 'react';
import { X, Plus, LogIn, RefreshCw, Users, Shield, Zap, AlertCircle, RotateCcw, Crown } from 'lucide-react';
import { apiService } from '../services/apiService';

// Standard 32 initial pieces configuration
const INITIAL_PIECES = [
  // Black pieces (Row 0 - 3)
  { row: 0, col: 0, type: 'Rook', color: 'Black', name: 'Xe Trái (Đen)', char: '車' },
  { row: 0, col: 1, type: 'Horse', color: 'Black', name: 'Mã Trái (Đen)', char: '馬' },
  { row: 0, col: 2, type: 'Elephant', color: 'Black', name: 'Tượng Trái (Đen)', char: '象' },
  { row: 0, col: 3, type: 'Advisor', color: 'Black', name: 'Sĩ Trái (Đen)', char: '士' },
  { row: 0, col: 4, type: 'King', color: 'Black', name: 'Tướng (Đen)', char: '將', isKing: true },
  { row: 0, col: 5, type: 'Advisor', color: 'Black', name: 'Sĩ Phải (Đen)', char: '士' },
  { row: 0, col: 6, type: 'Elephant', color: 'Black', name: 'Tượng Phải (Đen)', char: '象' },
  { row: 0, col: 7, type: 'Horse', color: 'Black', name: 'Mã Phải (Đen)', char: '馬' },
  { row: 0, col: 8, type: 'Rook', color: 'Black', name: 'Xe Phải (Đen)', char: '車' },
  { row: 2, col: 1, type: 'Cannon', color: 'Black', name: 'Pháo Trái (Đen)', char: '砲' },
  { row: 2, col: 7, type: 'Cannon', color: 'Black', name: 'Pháo Phải (Đen)', char: '砲' },
  { row: 3, col: 0, type: 'Pawn', color: 'Black', name: 'Tốt 1 (Đen)', char: '卒' },
  { row: 3, col: 2, type: 'Pawn', color: 'Black', name: 'Tốt 3 (Đen)', char: '卒' },
  { row: 3, col: 4, type: 'Pawn', color: 'Black', name: 'Tốt 5 (Đen)', char: '卒' },
  { row: 3, col: 6, type: 'Pawn', color: 'Black', name: 'Tốt 7 (Đen)', char: '卒' },
  { row: 3, col: 8, type: 'Pawn', color: 'Black', name: 'Tốt 9 (Đen)', char: '卒' },

  // Red pieces (Row 6 - 9)
  { row: 6, col: 0, type: 'Pawn', color: 'Red', name: 'Binh 1 (Đỏ)', char: '兵' },
  { row: 6, col: 2, type: 'Pawn', color: 'Red', name: 'Binh 3 (Đỏ)', char: '兵' },
  { row: 6, col: 4, type: 'Pawn', color: 'Red', name: 'Binh 5 (Đỏ)', char: '兵' },
  { row: 6, col: 6, type: 'Pawn', color: 'Red', name: 'Binh 7 (Đỏ)', char: '兵' },
  { row: 6, col: 8, type: 'Pawn', color: 'Red', name: 'Binh 9 (Đỏ)', char: '兵' },
  { row: 7, col: 1, type: 'Cannon', color: 'Red', name: 'Pháo Trái (Đỏ)', char: '炮' },
  { row: 7, col: 7, type: 'Cannon', color: 'Red', name: 'Pháo Phải (Đỏ)', char: '炮' },
  { row: 9, col: 0, type: 'Rook', color: 'Red', name: 'Xe Trái (Đỏ)', char: '俥' },
  { row: 9, col: 1, type: 'Horse', color: 'Red', name: 'Mã Trái (Đỏ)', char: '傌' },
  { row: 9, col: 2, type: 'Elephant', color: 'Red', name: 'Tượng Trái (Đỏ)', char: '相' },
  { row: 9, col: 3, type: 'Advisor', color: 'Red', name: 'Sĩ Trái (Đỏ)', char: '仕' },
  { row: 9, col: 4, type: 'King', color: 'Red', name: 'Soái (Đỏ)', char: '帥', isKing: true },
  { row: 9, col: 5, type: 'Advisor', color: 'Red', name: 'Sĩ Phải (Đỏ)', char: '仕' },
  { row: 9, col: 6, type: 'Elephant', color: 'Red', name: 'Tượng Phải (Đỏ)', char: '相' },
  { row: 9, col: 7, type: 'Horse', color: 'Red', name: 'Mã Phải (Đỏ)', char: '傌' },
  { row: 9, col: 8, type: 'Rook', color: 'Red', name: 'Xe Phải (Đỏ)', char: '俥' }
];

export default function OnlineRoomModal({
  isOpen,
  currentUser,
  onClose,
  onCreateRoom,
  onJoinRoom
}) {
  const [tab, setTab] = useState('join'); // 'create', 'join', 'browse'
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [playAsRed, setPlayAsRed] = useState(true);
  const [playWithAi, setPlayWithAi] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handicap Mode States
  const [isHandicap, setIsHandicap] = useState(false);
  const [removedPositions, setRemovedPositions] = useState([]);
  const [handicapNotice, setHandicapNotice] = useState(null);

  useEffect(() => {
    if (currentUser?.displayName) {
      setPlayerName(currentUser.displayName);
    } else {
      const saved = localStorage.getItem('xiangqi_player_name');
      setPlayerName(saved || `KỳThủ_${Math.floor(Math.random() * 900 + 100)}`);
    }
  }, [currentUser, isOpen]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const rooms = await apiService.getRooms();
      setActiveRooms(rooms || []);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'browse') {
      fetchRooms();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  // Helper: check if a position is removed
  const isPosRemoved = (r, c) => {
    return removedPositions.some(p => p.row === r && p.col === c);
  };

  // Remaining pieces calculation
  const redRemaining = 16 - removedPositions.filter(p => p.row >= 6).length;
  const blackRemaining = 16 - removedPositions.filter(p => p.row <= 3).length;
  const isHandicapValid = !isHandicap || (redRemaining >= 2 && blackRemaining >= 2);

  const showTemporaryNotice = (msg) => {
    setHandicapNotice(msg);
    setTimeout(() => {
      setHandicapNotice(null);
    }, 2800);
  };

  // Toggle piece removal
  const handleTogglePiece = (piece) => {
    if (piece.isKing) {
      showTemporaryNotice('⚠️ Bắt buộc phải giữ quân Tướng (King), không thể chấp Tướng!');
      return;
    }

    const alreadyRemoved = isPosRemoved(piece.row, piece.col);

    if (alreadyRemoved) {
      // Re-enable piece
      setRemovedPositions(prev => prev.filter(p => !(p.row === piece.row && p.col === piece.col)));
    } else {
      // Check minimum 2 pieces constraint before removing
      const pieceColor = piece.color;
      const currentRemaining = pieceColor === 'Red' ? redRemaining : blackRemaining;
      if (currentRemaining <= 2) {
        showTemporaryNotice(`⚠️ Bên ${pieceColor === 'Red' ? 'Đỏ' : 'Đen'} phải giữ lại ít nhất 2 quân (gồm Tướng)!`);
        return;
      }
      setRemovedPositions(prev => [...prev, { row: piece.row, col: piece.col }]);
    }
  };

  // Quick Presets
  const applyPreset = (preset) => {
    switch (preset) {
      case 'reset':
        setRemovedPositions([]);
        break;
      case 'red_1_horse':
        setRemovedPositions([{ row: 9, col: 1 }]);
        break;
      case 'red_2_horse':
        setRemovedPositions([{ row: 9, col: 1 }, { row: 9, col: 7 }]);
        break;
      case 'red_1_cannon':
        setRemovedPositions([{ row: 7, col: 1 }]);
        break;
      case 'red_1_rook':
        setRemovedPositions([{ row: 9, col: 0 }]);
        break;
      case 'black_1_horse':
        setRemovedPositions([{ row: 0, col: 1 }]);
        break;
      case 'black_2_horse':
        setRemovedPositions([{ row: 0, col: 1 }, { row: 0, col: 7 }]);
        break;
      case 'black_1_cannon':
        setRemovedPositions([{ row: 2, col: 1 }]);
        break;
      default:
        break;
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;

    if (isHandicap) {
      if (redRemaining < 2 || blackRemaining < 2) {
        alert('Cấu hình chấp cờ không hợp lệ! Mỗi bên phải còn lại ít nhất 2 quân (gồm Tướng).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('xiangqi_player_name', playerName.trim());
      await onCreateRoom(
        playerName.trim(),
        currentUser?.username || null,
        roomName.trim(),
        playAsRed,
        isHandicap && removedPositions.length > 0,
        isHandicap ? removedPositions : [],
        playWithAi
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomIdInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem('xiangqi_player_name', playerName.trim());
      await onJoinRoom(roomIdInput.trim().toUpperCase(), playerName.trim(), currentUser?.username || null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: isHandicap && tab === 'create' ? 'min(96vw, 680px)' : 'min(92vw, 490px)',
          maxHeight: '92vh',
          overflowY: 'auto',
          transition: 'width 0.25s ease'
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Đấu Online Trực Tuyến</h2>
            {isHandicap && tab === 'create' && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                Chấp Cờ
              </span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="mode-tabs" style={{ marginBottom: '1.25rem' }}>
          <button
            className={`mode-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            <Plus size={16} />
            <span>Tạo Phòng</span>
          </button>
          <button
            className={`mode-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            <LogIn size={16} />
            <span>Nhập Mã</span>
          </button>
          <button
            className={`mode-tab ${tab === 'browse' ? 'active' : ''}`}
            onClick={() => setTab('browse')}
          >
            <Users size={16} />
            <span>Danh Sách</span>
          </button>
        </div>

        {/* Current User Badge or Player Name Input */}
        {currentUser ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--border-gold)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#a89a8c' }}>Tham gia với tư cách:</span>
              <div style={{ fontWeight: 800, color: '#ffd700', fontSize: '0.95rem' }}>
                {currentUser.displayName} (@{currentUser.username})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#a89a8c' }}>Kỳ lực:</span>
              <div style={{ fontWeight: 800, color: '#fef08a', fontSize: '0.95rem' }}>
                {currentUser.eloRating} Elo
              </div>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>Tên của bạn:</label>
            <input
              className="form-input"
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Nhập tên kỳ thủ..."
              maxLength={20}
              required
            />
          </div>
        )}

        {/* Create Room Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Tên phòng (tùy chọn):</label>
              <input
                className="form-input"
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="VD: Cao thủ giao hữu..."
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label>Chọn quân cầm:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${playAsRed ? 'btn-gold' : 'btn-dark'}`}
                  onClick={() => setPlayAsRed(true)}
                  style={{ justifyContent: 'center' }}
                >
                  🔴 Quân Đỏ (Đi trước)
                </button>
                <button
                  type="button"
                  className={`btn ${!playAsRed ? 'btn-gold' : 'btn-dark'}`}
                  onClick={() => setPlayAsRed(false)}
                  style={{ justifyContent: 'center' }}
                >
                  ⚫ Quân Đen (Đi sau)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Đối thủ:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${!playWithAi ? 'btn-gold' : 'btn-dark'}`}
                  onClick={() => setPlayWithAi(false)}
                  style={{ justifyContent: 'center', fontSize: '0.8rem' }}
                >
                  👥 Người chơi Online
                </button>
                <button
                  type="button"
                  className={`btn ${playWithAi ? 'btn-gold' : 'btn-dark'}`}
                  onClick={() => setPlayWithAi(true)}
                  style={{ justifyContent: 'center', fontSize: '0.8rem' }}
                >
                  🤖 Luyện tập với Máy AI
                </button>
              </div>
            </div>

            {/* Handicap Mode Checkbox Option */}
            <div
              style={{
                marginTop: '1rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: isHandicap ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: isHandicap ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '10px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isHandicap}
                  onChange={e => {
                    setIsHandicap(e.target.checked);
                    if (!e.target.checked) setRemovedPositions([]);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ fontWeight: 700, color: isHandicap ? '#fca5a5' : '#f3ece4', fontSize: '0.9rem' }}>
                    ⚡ Bật Chế Độ Chấp Cờ (Handicap Mode)
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#a89a8c' }}>
                    Cho phép chủ phòng tự chọn xóa quân cờ của Đỏ hoặc Đen trước trận đấu
                  </div>
                </div>
              </label>

              {/* Handicap Configuration Section */}
              {isHandicap && (
                <div style={{ marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(212, 175, 55, 0.25)' }}>
                  {/* Presets Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.76rem', color: '#d1c5b8', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Cấu hình mẫu nhanh:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => applyPreset('red_1_horse')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đỏ chấp 1 Mã
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('red_2_horse')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đỏ chấp 2 Mã
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('red_1_cannon')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đỏ chấp 1 Pháo
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('red_1_rook')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đỏ chấp 1 Xe
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('black_1_horse')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đen chấp 1 Mã
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('black_2_horse')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Đen chấp 2 Mã
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('reset')}
                        className="btn btn-dark"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: '#fde047', borderColor: 'rgba(234, 179, 8, 0.4)' }}
                      >
                        <RotateCcw size={11} style={{ marginRight: '2px' }} />
                        Khôi phục chuẩn
                      </button>
                    </div>
                  </div>

                  {/* Temporary Notice */}
                  {handicapNotice && (
                    <div
                      style={{
                        padding: '0.45rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        marginBottom: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>{handicapNotice}</span>
                    </div>
                  )}

                  {/* Remaining pieces count indicators */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span style={{ color: redRemaining < 2 ? '#ef4444' : '#f87171', fontWeight: 700 }}>
                      🔴 Đỏ: {redRemaining}/16 quân {redRemaining < 2 && '(Thiếu)'}
                    </span>
                    <span style={{ color: '#a89a8c' }}>
                      (Nhấp quân trên bàn cờ để Bật/Tắt chấp)
                    </span>
                    <span style={{ color: blackRemaining < 2 ? '#ef4444' : '#e2e8f0', fontWeight: 700 }}>
                      ⚫ Đen: {blackRemaining}/16 quân {blackRemaining < 2 && '(Thiếu)'}
                    </span>
                  </div>

                  {/* Preview Board Container */}
                  <div
                    style={{
                      background: 'radial-gradient(circle at center, #6b4423 0%, #3a2213 100%)',
                      border: '2px solid #d4af37',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      position: 'relative',
                      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {/* SVG Grid Lines */}
                    <svg viewBox="0 0 900 1000" style={{ width: '100%', height: 'auto', display: 'block' }}>
                      {/* Boundary */}
                      <rect x="50" y="50" width="800" height="900" fill="none" stroke="#a07246" strokeWidth="3" />
                      {/* Horizontal Lines */}
                      {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map((y, idx) => (
                        <line key={`h-${idx}`} x1="50" y1={y} x2="850" y2={y} stroke="#a07246" strokeWidth="2" />
                      ))}
                      {/* Vertical Lines */}
                      {[150, 250, 350, 450, 550, 650, 750].map((x, idx) => (
                        <g key={`v-${idx}`}>
                          <line x1={x} y1="50" x2={x} y2="450" stroke="#a07246" strokeWidth="2" />
                          <line x1={x} y1="550" x2={x} y2="950" stroke="#a07246" strokeWidth="2" />
                        </g>
                      ))}
                      {/* Top Palace */}
                      <line x1="350" y1="50" x2="550" y2="250" stroke="#a07246" strokeWidth="1.8" />
                      <line x1="550" y1="50" x2="350" y2="250" stroke="#a07246" strokeWidth="1.8" />
                      {/* Bottom Palace */}
                      <line x1="350" y1="750" x2="550" y2="950" stroke="#a07246" strokeWidth="1.8" />
                      <line x1="550" y1="750" x2="350" y2="950" stroke="#a07246" strokeWidth="1.8" />
                      {/* River Text */}
                      <text x="250" y="515" fill="#a07246" fontSize="32" fontWeight="bold" fontFamily="serif" textAnchor="middle">楚 河</text>
                      <text x="650" y="515" fill="#a07246" fontSize="32" fontWeight="bold" fontFamily="serif" textAnchor="middle">漢 界</text>

                      {/* Interactive Pieces on SVG */}
                      {INITIAL_PIECES.map((piece) => {
                        const cx = 50 + piece.col * 100;
                        const cy = 50 + piece.row * 100;
                        const removed = isPosRemoved(piece.row, piece.col);
                        const isRed = piece.color === 'Red';

                        return (
                          <g
                            key={`preview-${piece.row}-${piece.col}`}
                            onClick={() => handleTogglePiece(piece)}
                            style={{
                              cursor: piece.isKing ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: removed ? 0.22 : 1
                            }}
                          >
                            {/* Piece Outer Circle */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r="36"
                              fill={isRed ? '#fffaf0' : '#1c1917'}
                              stroke={removed ? '#ef4444' : isRed ? '#dc2626' : '#78716c'}
                              strokeWidth={piece.isKing ? '4' : '3'}
                            />

                            {/* Piece Inner Ring */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r="30"
                              fill="none"
                              stroke={isRed ? '#ef4444' : '#a8a29e'}
                              strokeWidth="1.5"
                            />

                            {/* King Indicator Crown */}
                            {piece.isKing && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r="34"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                              />
                            )}

                            {/* Piece Character */}
                            <text
                              x={cx}
                              y={cy + 13}
                              fill={isRed ? '#b91c1c' : '#f5f5f4'}
                              fontSize="36"
                              fontWeight="bold"
                              fontFamily="serif"
                              textAnchor="middle"
                            >
                              {piece.char}
                            </text>

                            {/* Strikethrough Cross Badge on Removed Pieces */}
                            {removed && (
                              <g stroke="#ef4444" strokeWidth="5">
                                <line x1={cx - 24} y1={cy - 24} x2={cx + 24} y2={cy + 24} />
                                <line x1={cx + 24} y1={cy - 24} x2={cx - 24} y2={cy + 24} />
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Removed Pieces List Summary */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.76rem', color: '#d1c5b8', fontWeight: 600 }}>
                        Quân cờ bị chấp ({removedPositions.length} quân):
                      </span>
                      {removedPositions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRemovedPositions([])}
                          style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Xóa tất cả chấp
                        </button>
                      )}
                    </div>

                    {removedPositions.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: '#a89a8c', fontStyle: 'italic' }}>
                        Chưa chọn quân chấp nào (Bàn cờ 32 quân tiêu chuẩn). Nhấp vào quân trên bàn cờ hoặc chọn preset để chấp quân.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {removedPositions.map(pos => {
                          const p = INITIAL_PIECES.find(item => item.row === pos.row && item.col === pos.col);
                          if (!p) return null;
                          const isRed = p.color === 'Red';
                          return (
                            <span
                              key={`tag-${pos.row}-${pos.col}`}
                              onClick={() => handleTogglePiece(p)}
                              title="Nhấp để hoàn tác quân này"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 7px',
                                background: isRed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                border: `1px solid ${isRed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                color: isRed ? '#fca5a5' : '#e2e8f0',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{p.char}</span>
                              <span>{p.name}</span>
                              <X size={11} style={{ opacity: 0.7 }} />
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={isSubmitting || !isHandicapValid}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '0.5rem',
                padding: '0.75rem',
                opacity: (isSubmitting || !isHandicapValid) ? 0.6 : 1
              }}
            >
              {isSubmitting
                ? 'Đang Khởi Tạo Phòng...'
                : !isHandicapValid
                ? 'Cấu Hình Chấp Không Hợp Lệ (Thiếu Quân)'
                : isHandicap && removedPositions.length > 0
                ? `Tạo Phòng Chấp (${removedPositions.length} Quân) & Bắt Đầu`
                : 'Tạo Phòng & Bắt Đầu'}
            </button>
          </form>
        )}

        {/* Join by Code Form */}
        {tab === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label>Mã phòng (6 ký tự):</label>
              <input
                className="form-input"
                type="text"
                value={roomIdInput}
                onChange={e => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="VD: 7XA9K2"
                maxLength={8}
                style={{ fontFamily: 'monospace', letterSpacing: '3px', fontSize: '1.2rem', textAlign: 'center' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Đang Kết Nối...' : 'Vào Phòng Thi Đấu'}
            </button>
          </form>
        )}

        {/* Active Rooms List */}
        {tab === 'browse' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#a89a8c' }}>Phòng đang mở:</span>
              <button
                className="btn btn-dark"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                onClick={fetchRooms}
                disabled={loadingRooms}
              >
                <RefreshCw size={12} className={loadingRooms ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeRooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#887', fontSize: '0.85rem' }}>
                  Hiện chưa có phòng nào mở. Hãy tạo một phòng mới!
                </div>
              ) : (
                activeRooms.map(r => (
                  <div
                    key={r.roomId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.8rem',
                      background: 'rgba(15, 12, 9, 0.7)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffd700' }}>
                          {r.roomName}
                        </span>
                        {r.isHandicap && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            Chấp Cờ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a89a8c', marginTop: '2px' }}>
                        Mã: <code>{r.roomId}</code> • Đỏ: {r.redPlayerName} • Đen: {r.blackPlayerName}
                      </div>
                    </div>
                    <button
                      className="btn btn-gold"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => onJoinRoom(r.roomId, playerName.trim(), currentUser?.username || null)}
                    >
                      Tham gia
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
