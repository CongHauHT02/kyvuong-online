import React, { useState } from 'react';
import {
  Bot,
  Users,
  Globe,
  RotateCcw,
  RefreshCw,
  Flag,
  Handshake,
  Volume2,
  VolumeX,
  Languages,
  Copy,
  Check
} from 'lucide-react';

export default function GameControls({
  gameMode,
  setGameMode,
  aiDifficulty,
  setAiDifficulty,
  isFlipped,
  setIsFlipped,
  showVietnamese,
  setShowVietnamese,
  isMuted,
  onToggleSound,
  onNewGame,
  onResign,
  onOfferDraw,
  onlineRoomId,
  onOpenOnlineModal,
  isAiThinking
}) {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } else {
        window.prompt('Sao chép mã phòng đấu (Ctrl+C):', text);
      }
    } catch {
      window.prompt('Sao chép mã phòng đấu (Ctrl+C):', text);
    }
  };

  const handleCopyRoomId = () => {
    if (!onlineRoomId) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(onlineRoomId)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          })
          .catch(() => fallbackCopy(onlineRoomId));
      } else {
        fallbackCopy(onlineRoomId);
      }
    } catch {
      fallbackCopy(onlineRoomId);
    }
  };

  return (
    <div className="dashboard-card" style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
      {/* Mode Tabs */}
      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab ${gameMode === 'ai' ? 'active' : ''}`}
          onClick={() => setGameMode('ai')}
        >
          <Bot size={18} />
          <span>Đấu với Máy</span>
        </button>

        <button
          type="button"
          className={`mode-tab ${gameMode === 'local' ? 'active' : ''}`}
          onClick={() => setGameMode('local')}
        >
          <Users size={18} />
          <span>2 Người Chơi</span>
        </button>

        <button
          type="button"
          className={`mode-tab ${gameMode === 'online' ? 'active' : ''}`}
          onClick={() => {
            setGameMode('online');
            if (!onlineRoomId) onOpenOnlineModal();
          }}
        >
          <Globe size={18} />
          <span>Đấu Online</span>
        </button>
      </div>

      {/* AI Difficulty Options */}
      {gameMode === 'ai' && (
        <div className="difficulty-selector">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d1c5b8' }}>
            Độ khó AI:
          </span>
          <div className="diff-options">
            {['Easy', 'Medium', 'Hard'].map(diff => {
              const label = diff === 'Easy' ? 'Dễ' : diff === 'Medium' ? 'Trung Bình' : 'Khó';
              return (
                <button
                  type="button"
                  key={diff}
                  className={`diff-btn ${aiDifficulty === diff ? 'active' : ''}`}
                  onClick={() => setAiDifficulty(diff)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Online Room Info Banner */}
      {gameMode === 'online' && onlineRoomId && (
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
            <span style={{ fontSize: '0.72rem', color: '#a89a8c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MÃ PHÒNG ĐẤU:
            </span>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#ffd700', letterSpacing: '1px' }}>
              {onlineRoomId}
            </div>
          </div>
          <button
            type="button"
            className={`btn ${copied ? 'btn-gold' : 'btn-dark'}`}
            style={{ padding: '0.45rem 0.85rem', fontWeight: 700 }}
            onClick={handleCopyRoomId}
            title="Bấm để chép mã phòng đấu gửi bạn bè"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
          </button>
        </div>
      )}

      {/* AI Thinking Notice */}
      {isAiThinking && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid var(--gold-primary)',
            color: '#ffd700',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <RotateCcw className="animate-spin" size={16} />
          <span>Máy đang suy nghĩ nước đi...</span>
        </div>
      )}

      {/* Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-gold"
          onClick={onNewGame}
          title="Bắt đầu một ván cờ mới"
        >
          <RefreshCw size={16} />
          <span>Ván Mới</span>
        </button>

        <button
          type="button"
          className={`btn ${isFlipped ? 'btn-gold' : 'btn-dark'}`}
          onClick={() => setIsFlipped(!isFlipped)}
          title="Xoay đảo chiều bàn cờ 180 độ"
        >
          <RotateCcw size={16} />
          <span>{isFlipped ? 'Góc Nhìn: Quân Đen' : 'Góc Nhìn: Quân Đỏ'}</span>
        </button>

        <button
          type="button"
          className={`btn ${showVietnamese ? 'btn-gold' : 'btn-dark'}`}
          onClick={() => setShowVietnamese(!showVietnamese)}
          title="Bấm để chuyển đổi giữa Chữ Tiếng Việt và Chữ Hán truyền thống trên quân cờ"
        >
          <Languages size={16} />
          <span>{showVietnamese ? 'Mặt Cờ: Chữ Việt' : 'Mặt Cờ: Chữ Hán'}</span>
        </button>

        <button
          type="button"
          className={`btn ${isMuted ? 'btn-danger' : 'btn-dark'}`}
          onClick={onToggleSound}
          title="Bật hoặc tắt âm thanh đặt quân và ăn quân"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span>{isMuted ? 'Âm Thanh: Tắt' : 'Âm Thanh: Bật'}</span>
        </button>

        <button
          type="button"
          className="btn btn-danger"
          onClick={onResign}
          title="Xin nhận thua ván này"
        >
          <Flag size={16} />
          <span>Xin Thua</span>
        </button>

        <button
          type="button"
          className="btn btn-dark"
          onClick={onOfferDraw}
          title="Gửi lời đề nghị hòa cờ tới đối phương"
        >
          <Handshake size={16} />
          <span>Xin Hòa</span>
        </button>
      </div>
    </div>
  );
}
