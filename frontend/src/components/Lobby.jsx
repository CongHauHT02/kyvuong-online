import React, { useState, useEffect } from 'react';
import {
  Swords,
  PlusCircle,
  Bot,
  Users,
  Trophy,
  User,
  LogOut,
  RefreshCw,
  Search,
  Eye,
  MessageSquare,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Crown,
  Flame
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { signalRService } from '../services/signalrService';

export default function Lobby({
  currentUser,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenFriends,
  onStartAiGame,
  onStartLocalGame,
  onOpenCreateRoom,
  onJoinRoom,
  onQuickMatch,
  isMuted,
  onToggleMute,
  friendRequestsCount = 0,
  onInviteFriendDirectly
}) {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomFilter, setRoomFilter] = useState('');
  const [onlineFriends, setOnlineFriends] = useState([]);

  // Lobby World Chat State
  const [lobbyMessages, setLobbyMessages] = useState([
    { sender: 'Hệ Thống', message: 'Chào mừng các kỳ thủ đã đến với Kỳ Vương Online!', timestamp: new Date() }
  ]);
  const [lobbyInput, setLobbyInput] = useState('');

  // Top Players preview
  const [topPlayers, setTopPlayers] = useState([]);

  // 1. Fetch Rooms & Leaderboard
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await apiService.getRooms();
      setRooms(data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchTopPlayers = async () => {
    try {
      const data = await apiService.getLeaderboard();
      setTopPlayers((data || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser) return;
    try {
      const data = await apiService.getFriends();
      setOnlineFriends((data || []).filter(f => f.isOnline));
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchTopPlayers();
    fetchFriends();

    // Listen to real-time rooms updates from GameHub
    const handleRoomsUpdated = (updatedRooms) => {
      setRooms(updatedRooms || []);
    };

    const handleLobbyChat = (msg) => {
      setLobbyMessages(prev => [...prev.slice(-40), msg]);
    };

    const handlePresence = () => {
      fetchFriends();
    };

    signalRService.on('RoomsUpdated', handleRoomsUpdated);
    signalRService.on('LobbyChatMessageReceived', handleLobbyChat);
    signalRService.on('UserPresenceChanged', handlePresence);

    const interval = setInterval(() => {
      fetchRooms();
      if (currentUser) fetchFriends();
    }, 15000);

    return () => {
      signalRService.off('RoomsUpdated', handleRoomsUpdated);
      signalRService.off('LobbyChatMessageReceived', handleLobbyChat);
      signalRService.off('UserPresenceChanged', handlePresence);
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleSendLobbyChat = async (e) => {
    e.preventDefault();
    if (!lobbyInput.trim()) return;

    const senderName = currentUser ? currentUser.displayName : 'Khách';
    try {
      await signalRService.sendLobbyChat(senderName, lobbyInput.trim());
      setLobbyInput('');
    } catch (err) {
      console.error('Error sending lobby chat:', err);
    }
  };

  const filteredRooms = rooms.filter(r =>
    (r.roomName && r.roomName.toLowerCase().includes(roomFilter.toLowerCase())) ||
    (r.roomId && r.roomId.toLowerCase().includes(roomFilter.toLowerCase())) ||
    (r.redPlayerName && r.redPlayerName.toLowerCase().includes(roomFilter.toLowerCase())) ||
    (r.blackPlayerName && r.blackPlayerName.toLowerCase().includes(roomFilter.toLowerCase()))
  );

  const getRankBadge = (elo) => {
    if (elo >= 1800) return { title: 'Kỳ Thánh', bg: '#ca8a04', color: '#1a1005' };
    if (elo >= 1500) return { title: 'Đại Kỳ Sư', bg: '#9333ea', color: '#fff' };
    if (elo >= 1300) return { title: 'Cao Thủ', bg: '#dc2626', color: '#fff' };
    if (elo >= 1100) return { title: 'Kỳ Sĩ', bg: '#2563eb', color: '#fff' };
    return { title: 'Tập Sự', bg: '#52525b', color: '#fff' };
  };

  return (
    <div className="lobby-layout">
      {/* Top Header Bar */}
      <header className="lobby-header-bar">
        {/* Logo Brand */}
        <div className="logo-group">
          <div className="logo-badge">
            <Crown size={22} color="#b91c1c" />
          </div>
          <div className="logo-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1>KỲ VƯƠNG ONLINE</h1>
              <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                LIVE
              </span>
            </div>
            <span>ĐẤU TRƯỜNG CỜ TƯỚNG TRỰC TUYẾN</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Friends Button */}
          <button
            onClick={onOpenFriends}
            className="btn btn-dark"
            style={{ position: 'relative' }}
            title="Danh sách bạn bè & Lời mời"
          >
            <Users size={16} color="#ffd700" />
            <span>Hảo Hữu</span>
            {friendRequestsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }}
              >
                {friendRequestsCount}
              </span>
            )}
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="btn btn-dark"
            title="Bảng xếp hạng kỳ vương"
          >
            <Trophy size={16} color="#ffd700" />
            <span>Xếp Hạng</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="btn-icon"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="#ffd700" />}
          </button>

          {/* User Profile Card */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid rgba(212, 175, 55, 0.25)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '20px'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #b8860b)', color: '#1a1005', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fef08a' }}>
                  {currentUser.displayName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#ffd700', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '10px', fontFamily: 'monospace' }}>
                  ⭐ {currentUser.eloRating}
                </div>
              </div>

              <button
                onClick={() => {
                  apiService.logout();
                  window.location.reload();
                }}
                className="btn-icon"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-gold"
              style={{ padding: '0.55rem 1.25rem' }}
            >
              <User size={16} />
              <span>Đăng Nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="lobby-main-body">
        {/* User Hero Banner (If logged in) */}
        {currentUser && (
          <div className="user-hero-card">
            <div className="user-hero-info">
              <div className="user-hero-avatar">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'K'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                    {currentUser.displayName}
                  </h2>
                  <span
                    style={{
                      background: getRankBadge(currentUser.eloRating).bg,
                      color: getRankBadge(currentUser.eloRating).color,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {getRankBadge(currentUser.eloRating).title}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a89a8c', marginTop: '2px' }}>
                  @{currentUser.username}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="user-hero-stats">
              <div className="stat-item">
                <div className="label">Kỳ Lực (Elo)</div>
                <div className="value" style={{ color: '#ffd700' }}>⭐ {currentUser.eloRating}</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(212, 175, 55, 0.2)' }} />
              <div className="stat-item">
                <div className="label">Thắng</div>
                <div className="value" style={{ color: '#4ade80' }}>{currentUser.wins || 0}</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(212, 175, 55, 0.2)' }} />
              <div className="stat-item">
                <div className="label">Thua</div>
                <div className="value" style={{ color: '#f87171' }}>{currentUser.losses || 0}</div>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(212, 175, 55, 0.2)' }} />
              <div className="stat-item">
                <div className="label">Hòa</div>
                <div className="value" style={{ color: '#fef08a' }}>{currentUser.draws || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Main Game Modes */}
        <div>
          <div className="modes-section-title">
            <h3>
              <Flame size={18} color="#ef4444" />
              <span>CHỌN CHẾ ĐỘ THI ĐẤU</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a89a8c' }}>Chọn chế độ để xuất trận</span>
          </div>

          <div className="modes-grid">
            {/* Mode 1: Quick Match */}
            <div className="mode-card primary" onClick={onQuickMatch}>
              <div className="mode-icon-badge" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff' }}>
                <Swords size={24} />
              </div>
              <div className="mode-title">Ghép Trận Nhanh</div>
              <div className="mode-desc">
                Tự động tìm kiếm đối thủ hoặc sảnh chờ mở để giao lưu tức thì.
              </div>
              <div className="mode-action-link" style={{ color: '#f87171' }}>
                <span>Vào Trận Ngay</span>
                <span>→</span>
              </div>
            </div>

            {/* Mode 2: Create Custom Room */}
            <div className="mode-card" onClick={onOpenCreateRoom}>
              <div className="mode-icon-badge" style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#1a1005' }}>
                <PlusCircle size={24} />
              </div>
              <div className="mode-title">Tạo Phòng Riêng</div>
              <div className="mode-desc">
                Tự đặt tên phòng, chọn bên Đỏ/Đen, mời bạn bè cùng tỉ thí.
              </div>
              <div className="mode-action-link">
                <span>Thiết Lập Phòng</span>
                <span>→</span>
              </div>
            </div>

            {/* Mode 3: Play with AI */}
            <div className="mode-card" style={{ cursor: 'default' }}>
              <div className="mode-icon-badge" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                <Bot size={24} />
              </div>
              <div className="mode-title">Đấu Với Máy (AI)</div>
              <div className="mode-desc">
                Rèn luyện kỳ nghệ cùng AI Minimax với 3 mức độ.
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.85rem' }}>
                <button
                  onClick={() => onStartAiGame('Easy')}
                  className="btn"
                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#86efac', justifyContent: 'center' }}
                >
                  Dễ
                </button>
                <button
                  onClick={() => onStartAiGame('Medium')}
                  className="btn"
                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.72rem', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid rgba(234, 179, 8, 0.5)', color: '#fde047', justifyContent: 'center' }}
                >
                  Vừa
                </button>
                <button
                  onClick={() => onStartAiGame('Hard')}
                  className="btn"
                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', justifyContent: 'center' }}
                >
                  Khó
                </button>
              </div>
            </div>

            {/* Mode 4: Pass & Play */}
            <div className="mode-card" onClick={onStartLocalGame}>
              <div className="mode-icon-badge" style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff' }}>
                <Users size={24} />
              </div>
              <div className="mode-title">Chơi 2 Người Cùng Máy</div>
              <div className="mode-desc">
                Đánh cờ trực tiếp cùng bạn bè trên một màn hình chung.
              </div>
              <div className="mode-action-link" style={{ color: '#6ee7b7' }}>
                <span>Bắt Đầu Ngay</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Split Grid: Rooms Panel vs Sidebar */}
        <div className="lobby-split-grid">
          {/* Left Column: Sảnh Phòng Thi Đấu */}
          <div className="rooms-panel">
            <div className="rooms-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.4rem', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '8px', color: '#ffd700' }}>
                  <Swords size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '0.95rem', color: '#fff' }}>
                    SẢNH BÀN CỜ TRỰC TUYẾN
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a89a8c' }}>
                    Đang có {rooms.length} phòng thi đấu
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                    placeholder="Tìm mã hoặc tên phòng..."
                    className="form-input"
                    style={{ padding: '0.35rem 0.65rem 0.35rem 1.85rem', fontSize: '0.78rem', width: '160px' }}
                  />
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '9px', color: '#a89a8c' }} />
                </div>
                <button
                  onClick={fetchRooms}
                  disabled={loadingRooms}
                  className="btn btn-dark"
                  style={{ padding: '0.35rem 0.65rem' }}
                  title="Làm mới sảnh phòng"
                >
                  <RefreshCw size={13} className={loadingRooms ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Rooms List */}
            <div className="rooms-list">
              {filteredRooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(12, 9, 7, 0.5)', borderRadius: '12px', border: '1px dashed rgba(212, 175, 55, 0.2)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#d4af37' }}>
                    <Swords size={22} />
                  </div>
                  <div style={{ fontWeight: 700, color: '#f3ece4', fontSize: '0.95rem' }}>
                    Chưa có bàn cờ nào đang mở
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#a89a8c', maxWidth: '320px', margin: '0.5rem auto 1.25rem auto' }}>
                    Hãy là người đầu tiên tạo phòng mới để các kỳ thủ khác vào giao lưu nhé!
                  </p>
                  <button onClick={onOpenCreateRoom} className="btn btn-gold" style={{ padding: '0.5rem 1.25rem' }}>
                    <PlusCircle size={15} />
                    <span>Tạo Bàn Cờ Ngay</span>
                  </button>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const isFull = room.hasRedPlayer && room.hasBlackPlayer;
                  const canJoin = !isFull;

                  return (
                    <div key={room.roomId} className="room-card-item">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', background: 'rgba(212, 175, 55, 0.15)', color: '#ffd700', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                            #{room.roomId}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                            {room.roomName}
                          </span>
                          {room.isHandicap && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)'
                              }}
                            >
                              ⚡ Chấp Cờ
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '8px',
                              background: canJoin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                              color: canJoin ? '#4ade80' : '#fde047',
                              border: `1px solid ${canJoin ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
                            }}
                          >
                            {canJoin ? 'Đang Chờ (1/2)' : 'Đang Đấu (2/2)'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem', color: '#a89a8c' }}>
                          <span>🔴 {room.redPlayerName || 'Trống'}</span>
                          <span>vs</span>
                          <span>⚫ {room.blackPlayerName || 'Trống'}</span>
                          {room.observersCount > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Eye size={12} /> {room.observersCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        {canJoin ? (
                          <button
                            onClick={() => {
                              const pName = currentUser?.displayName || localStorage.getItem('xiangqi_player_name');
                              onJoinRoom(room.roomId, pName, currentUser?.username);
                            }}
                            className="btn btn-gold"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                          >
                            <Swords size={14} />
                            <span>Vào Chiến</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const pName = currentUser?.displayName || localStorage.getItem('xiangqi_player_name');
                              onJoinRoom(room.roomId, pName, currentUser?.username);
                            }}
                            className="btn btn-dark"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                          >
                            <Eye size={14} />
                            <span>Xem Trận</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Sidebar Widgets */}
          <div className="sidebar-widgets">
            {/* Widget 1: Hảo Hữu Online */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} color="#ffd700" />
                  HẢO HỮU ONLINE ({onlineFriends.length})
                </span>
                <button
                  onClick={onOpenFriends}
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Quản Lý
                </button>
              </div>

              {!currentUser ? (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: '#a89a8c' }}>
                  Đăng nhập để xem danh sách bạn bè và tỉ thí cờ tướng!
                </div>
              ) : onlineFriends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.78rem', color: '#887' }}>
                  Chưa có bạn bè nào đang online.
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={onOpenFriends}
                      style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      + Tìm và kết bạn ngay
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {onlineFriends.map((f) => (
                    <div key={f.id} className="friend-lobby-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#b8860b', color: '#1a1005', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {f.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f3ece4' }}>
                            {f.displayName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#ffd700' }}>
                            ⭐ {f.eloRating}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onInviteFriendDirectly(f.username, f.displayName)}
                        className="btn btn-gold"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        <Swords size={12} />
                        <span>Mời Đấu</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget 2: World Lobby Chat */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} color="#ffd700" />
                  GIAO LƯU SẢNH CHỜ
                </span>
                <span style={{ fontSize: '0.68rem', color: '#a89a8c' }}>Toàn Máy Chủ</span>
              </div>

              <div className="chat-box" style={{ height: '160px', marginTop: 0 }}>
                <div className="chat-messages">
                  {lobbyMessages.map((msg, idx) => (
                    <div key={idx} className="chat-msg">
                      <span className="sender">{msg.sender}:</span>
                      <span>{msg.message}</span>
                    </div>
                  ))}
                </div>
                <form className="chat-input-row" onSubmit={handleSendLobbyChat}>
                  <input
                    type="text"
                    value={lobbyInput}
                    onChange={(e) => setLobbyInput(e.target.value)}
                    placeholder="Nhắn tin giao lưu..."
                    className="chat-input"
                    maxLength={100}
                  />
                  <button type="submit" className="btn btn-gold" style={{ padding: '0.35rem 0.65rem' }}>
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>

            {/* Widget 3: Top 5 Kỳ Thủ */}
            <div className="sidebar-card">
              <div className="sidebar-card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trophy size={16} color="#ffd700" />
                  TOP 5 CAO THỦ
                </span>
                <button
                  onClick={onOpenLeaderboard}
                  style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Xem Thêm
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {topPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(10, 8, 6, 0.5)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          width: '18px',
                          color: idx === 0 ? '#ffd700' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#b45309' : '#71717a'
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, color: '#f3ece4' }}>{p.displayName}</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ffd700' }}>
                      ⭐ {p.eloRating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(212, 175, 55, 0.2)', padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#887' }}>
        <div>Kỳ Vương Online • Đấu Trường Cờ Tướng Trực Tuyến © 2026</div>
        <div style={{ fontSize: '0.7rem', color: '#665', marginTop: '4px' }}>Nền tảng .NET Core 9.0 + SignalR + ReactJS</div>
      </footer>
    </div>
  );
}
