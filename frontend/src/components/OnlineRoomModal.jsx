import React, { useState, useEffect } from 'react';
import { X, Plus, LogIn, RefreshCw, Users, Shield } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function OnlineRoomModal({
  isOpen,
  currentUser,
  onClose,
  onCreateRoom,
  onJoinRoom
}) {
  const [tab, setTab] = useState('join'); // 'create' or 'join' or 'browse'
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [playAsRed, setPlayAsRed] = useState(true);
  const [activeRooms, setActiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem('xiangqi_player_name', playerName.trim());
      await onCreateRoom(playerName.trim(), currentUser?.username || null, roomName.trim(), playAsRed);
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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Đấu Online Trực Tuyến</h2>
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

            <button
              type="submit"
              className="btn btn-gold"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? 'Đang Khởi Tạo Phòng...' : 'Tạo Phòng & Bắt Đầu'}
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
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffd700' }}>
                        {r.roomName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a89a8c' }}>
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
