import React, { useEffect, useState } from 'react';
import { Swords, Clock, User, Bot } from 'lucide-react';
import { audio } from '../services/audioService';

export default function TurnToast({
  currentTurn,
  redPlayerName,
  blackPlayerName,
  isAiTurn,
  isMyTurn,
  gameMode
}) {
  const [visible, setVisible] = useState(false);
  const [turnInfo, setTurnInfo] = useState({ turn: 'Red', name: '' });

  useEffect(() => {
    if (!currentTurn) return;

    const isRed = currentTurn === 'Red';
    const name = isRed ? redPlayerName : blackPlayerName;

    setTurnInfo({
      turn: currentTurn,
      name,
      isRed,
      isAi: isRed ? false : (gameMode === 'ai'),
      isMine: isMyTurn
    });

    setVisible(true);
    audio.playTurnSound();

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentTurn, redPlayerName, blackPlayerName, isMyTurn, gameMode]);

  if (!visible) return null;

  const isRed = turnInfo.turn === 'Red';

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed',
        top: '75px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        pointerEvents: 'auto',
        cursor: 'pointer',
        animation: 'slide-down-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.75rem 1.6rem',
          borderRadius: '35px',
          background: isRed
            ? 'linear-gradient(135deg, rgba(60, 15, 15, 0.95) 0%, rgba(30, 10, 10, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(30, 25, 20, 0.95) 0%, rgba(15, 12, 10, 0.95) 100%)',
          border: isRed ? '2px solid #ef4444' : '2px solid #ffd700',
          boxShadow: isRed
            ? '0 8px 30px rgba(239, 68, 68, 0.45), 0 0 15px rgba(239, 68, 68, 0.3)'
            : '0 8px 30px rgba(212, 175, 55, 0.45), 0 0 15px rgba(212, 175, 55, 0.3)',
          backdropFilter: 'blur(12px)',
          color: '#fff',
          userSelect: 'none'
        }}
      >
        {/* Animated Badge Icon */}
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: isRed
              ? 'radial-gradient(circle at 35% 30%, #fef3c7, #ecd09f, #b8860b)'
              : 'radial-gradient(circle at 35% 30%, #44352b, #261e18, #090705)',
            border: '2px solid #ffd700',
            color: isRed ? '#b91c1c' : '#fef08a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Noto Serif TC, serif',
            fontWeight: 900,
            fontSize: '1.25rem',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          {isRed ? '帥' : '將'}
        </div>

        {/* Text Details */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 800,
                color: isRed ? '#fca5a5' : '#ffd700'
              }}
            >
              {isRed ? 'LƯỢT QUÂN ĐỎ' : 'LƯỢT QUÂN ĐEN'}
            </span>
            {turnInfo.isMine && (
              <span
                style={{
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}
              >
                BẠN ĐI
              </span>
            )}
            {turnInfo.isAi && (
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.3)',
                  color: '#ffd700',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}
              >
                MÁY AI
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.05rem',
              color: '#fff'
            }}
          >
            {turnInfo.isMine
              ? 'Đến lượt bạn đi nước cờ!'
              : turnInfo.isAi
              ? 'Máy AI đang tính nước đi...'
              : `${turnInfo.name} đang suy nghĩ...`}
          </div>
        </div>

        <div style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
          <Clock size={16} className="animate-spin" color={isRed ? '#fca5a5' : '#ffd700'} />
        </div>
      </div>
    </div>
  );
}
