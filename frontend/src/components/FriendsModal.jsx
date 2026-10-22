import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Swords, Check, X, Trash2, Search, Sparkles, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function FriendsModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onInviteFriend
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'requests', 'add'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiService.getFriends().catch(() => []),
        apiService.getFriendRequests().catch(() => [])
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadData();
    }
  }, [isOpen, currentUser]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;

    setStatusMessage({ text: 'Đang gửi lời mời...', type: 'info' });
    try {
      const res = await apiService.sendFriendRequest(targetUsername.trim());
      setStatusMessage({ text: res.message || 'Đã gửi lời mời thành công!', type: 'success' });
      setTargetUsername('');
      loadData();
    } catch (err) {
      setStatusMessage({ text: err.message, type: 'error' });
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await apiService.rejectFriendRequest(requestId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFriend = async (friendId, name) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${name}?`)) return;
    try {
      await apiService.removeFriend(friendId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#1a1005', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>HẢO HỮU KỲ VƯƠNG</h2>
              <span style={{ fontSize: '0.72rem', color: '#a89a8c' }}>Kết bạn bốn phương, giao lưu kỳ nghệ</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-icon"
              title="Làm mới"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Guest Warning */}
        {!currentUser ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#d4af37' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: '#ffd700', marginBottom: '0.5rem' }}>Bạn Chưa Đăng Nhập</h3>
            <p style={{ fontSize: '0.82rem', color: '#a89a8c', maxWidth: '320px', margin: '0 auto 1.5rem auto' }}>
              Hãy đăng nhập hoặc tạo tài khoản miễn phí để kết bạn và mời hảo hữu tỉ thí cờ tướng!
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="btn btn-gold"
              style={{ padding: '0.6rem 1.5rem' }}
            >
              Đăng Nhập Ngay
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mode-tabs" style={{ marginBottom: '1rem' }}>
              <button
                className={`mode-tab ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <Users size={15} />
                <span>Bạn Bè ({friends.length})</span>
              </button>
              <button
                className={`mode-tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
                style={{ position: 'relative' }}
              >
                <Sparkles size={15} />
                <span>Lời Mời</span>
                {requests.length > 0 && (
                  <span style={{ marginLeft: '4px', background: '#dc2626', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {requests.length}
                  </span>
                )}
              </button>
              <button
                className={`mode-tab ${activeTab === 'add' ? 'active' : ''}`}
                onClick={() => setActiveTab('add')}
              >
                <UserPlus size={15} />
                <span>Tìm Bạn</span>
              </button>
            </div>

            {/* Tab 1: Friends List */}
            {activeTab === 'list' && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {friends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#887', fontSize: '0.85rem' }}>
                    Bạn chưa có người bạn nào trong danh sách.
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setActiveTab('add')}
                        style={{ background: 'transparent', border: 'none', color: '#ffd700', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        + Tìm và kết bạn ngay
                      </button>
                    </div>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(15, 12, 9, 0.75)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #b8860b, #614013)', color: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {f.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              background: f.isOnline ? '#22c55e' : '#71717a',
                              border: '1.5px solid #14100c'
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{f.displayName}</span>
                            <span style={{ fontSize: '0.7rem', color: '#ffd700', background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                              ⭐ {f.eloRating}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#a89a8c' }}>
                            @{f.username} • <span style={{ color: f.isOnline ? '#4ade80' : '#887' }}>{f.isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {f.isOnline && (
                          <button
                            onClick={() => {
                              onClose();
                              onInviteFriend(f.username, f.displayName);
                            }}
                            className="btn btn-gold"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            <Swords size={12} />
                            <span>Mời Đấu</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFriend(f.userId, f.displayName)}
                          className="btn-icon"
                          title="Hủy kết bạn"
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Pending Requests */}
            {activeTab === 'requests' && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {requests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#887', fontSize: '0.85rem' }}>
                    Hiện không có lời mời kết bạn nào đang chờ.
                  </div>
                ) : (
                  requests.map((r) => (
                    <div
                      key={r.requestId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(15, 12, 9, 0.75)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#3b2818', color: '#ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {r.fromDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                            {r.fromDisplayName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#a89a8c' }}>
                            @{r.fromUsername} • ⭐ {r.fromElo}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleAccept(r.requestId)}
                          className="btn btn-gold"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Đồng ý"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleReject(r.requestId)}
                          className="btn btn-dark"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Từ chối"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Add Friend */}
            {activeTab === 'add' && (
              <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nhập Tên Đăng Nhập Của Bạn Bè:</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder="Ví dụ: kythuvietnam"
                      className="form-input"
                      style={{ paddingLeft: '2rem' }}
                      required
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#887' }} />
                  </div>
                </div>

                {statusMessage.text && (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      background: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: statusMessage.type === 'success' ? '#86efac' : '#fca5a5',
                      border: `1px solid ${statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                    }}
                  >
                    {statusMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.7rem' }}
                >
                  <UserPlus size={15} />
                  <span>Gửi Lời Mời Kết Bạn</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
