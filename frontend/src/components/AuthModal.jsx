import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { apiService } from '../services/apiService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const data = await apiService.login(username, password);
        onAuthSuccess(data.user);
        onClose();
      } else {
        const data = await apiService.register(username, password, displayName || username);
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tab === 'login' ? 'Đăng Nhập Kỳ Thủ' : 'Đăng Ký Tài Khoản'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="mode-tabs" style={{ marginBottom: '1.25rem' }}>
          <button
            className={`mode-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            <LogIn size={16} />
            <span>Đăng Nhập</span>
          </button>

          <button
            className={`mode-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            <UserPlus size={16} />
            <span>Đăng Ký Mới</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên đăng nhập (Username):</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              required
              autoFocus
            />
          </div>

          {tab === 'register' && (
            <div className="form-group">
              <label>Tên hiển thị (Tên Kỳ Thủ):</label>
              <input
                className="form-input"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="VD: Bắc Kiếm Tiên, Thần Cờ..."
                maxLength={30}
              />
            </div>
          )}

          <div className="form-group">
            <label>Mật khẩu:</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1.25rem' }}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : tab === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
