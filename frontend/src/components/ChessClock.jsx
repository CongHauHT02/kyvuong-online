import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, Flame, ShieldAlert, Award } from 'lucide-react';
import { audio } from '../services/audioService';

export default function ChessClock({
  currentTurn = 'Red',
  status = 'Ongoing',
  redPlayerName = 'Kỳ Thủ Đỏ',
  blackPlayerName = 'Kỳ Thủ Đen',
  onTimeout,
  gameMode = 'ai',
  fullmoveNumber = 1
}) {
  // Time preset in minutes (5 = Blitz, 10 = Rapid WXF, 15 = Standard)
  const [presetMinutes, setPresetMinutes] = useState(10);
  const totalSeconds = presetMinutes * 60;
  const turnLimitSeconds = 90; // Maximum time allowed for single move (WXF Rule)

  const [redTime, setRedTime] = useState(totalSeconds);
  const [blackTime, setBlackTime] = useState(totalSeconds);
  const [turnTime, setTurnTime] = useState(turnLimitSeconds);

  const prevTurnRef = useRef(currentTurn);
  const prevMoveRef = useRef(fullmoveNumber);

  // Reset clock whenever preset changes or new game starts (fullmoveNumber resets to 1)
  useEffect(() => {
    setRedTime(presetMinutes * 60);
    setBlackTime(presetMinutes * 60);
    setTurnTime(turnLimitSeconds);
  }, [presetMinutes]);

  // When move changes, grant increment (+3s) to the side that just moved & reset turn time
  useEffect(() => {
    if (fullmoveNumber === 1 && status === 'Ongoing') {
      // New game reset
      setRedTime(presetMinutes * 60);
      setBlackTime(presetMinutes * 60);
      setTurnTime(turnLimitSeconds);
    } else if (prevTurnRef.current !== currentTurn) {
      // Previous side gets +3s Fischer increment
      if (prevTurnRef.current === 'Red') {
        setRedTime(prev => Math.min(presetMinutes * 60, prev + 3));
      } else {
        setBlackTime(prev => Math.min(presetMinutes * 60, prev + 3));
      }
      setTurnTime(turnLimitSeconds);
    }

    prevTurnRef.current = currentTurn;
    prevMoveRef.current = fullmoveNumber;
  }, [currentTurn, fullmoveNumber, status, presetMinutes]);

  // Main countdown timer interval
  useEffect(() => {
    const isGameActive = status === 'Ongoing' || status === 'Check';
    if (!isGameActive) return;

    const timer = setInterval(() => {
      setTurnTime(prev => {
        if (prev <= 1) {
          // Turn timeout
          audio.playTimeoutBuzzer();
          if (onTimeout) onTimeout(currentTurn);
          return 0;
        }
        return prev - 1;
      });

      if (currentTurn === 'Red') {
        setRedTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            audio.playTimeoutBuzzer();
            if (onTimeout) onTimeout('Red');
            return 0;
          }
          if (prev <= 10) {
            audio.playTickSound();
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            audio.playTimeoutBuzzer();
            if (onTimeout) onTimeout('Black');
            return 0;
          }
          if (prev <= 10) {
            audio.playTickSound();
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, status, onTimeout]);

  // Helper to format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRedTurn = currentTurn === 'Red';
  const redPercent = Math.max(0, Math.min(100, (redTime / (presetMinutes * 60)) * 100));
  const blackPercent = Math.max(0, Math.min(100, (blackTime / (presetMinutes * 60)) * 100));

  return (
    <div className="dashboard-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
      {/* Header bar with rules and preset selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffd700', fontSize: '0.85rem', fontWeight: 800 }}>
          <Clock size={16} />
          <span>ĐỒNG HỒ QUỐC TẾ (WXF)</span>
        </div>

        {/* Time Presets */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[
            { m: 5, label: '5P (Chớp)' },
            { m: 10, label: '10P (Nhanh)' },
            { m: 15, label: '15P (Chuẩn)' }
          ].map(p => (
            <button
              type="button"
              key={p.m}
              onClick={() => setPresetMinutes(p.m)}
              style={{
                padding: '0.2rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: presetMinutes === p.m ? '1px solid #ffd700' : '1px solid rgba(212, 175, 55, 0.2)',
                background: presetMinutes === p.m ? 'linear-gradient(180deg, #d4af37, #b8860b)' : 'rgba(20, 16, 12, 0.7)',
                color: presetMinutes === p.m ? '#1a1005' : '#a89a8c',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Clocks Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Red Player Clock */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '0.75rem',
            borderRadius: '10px',
            background: isRedTurn
              ? 'linear-gradient(135deg, rgba(60, 20, 20, 0.9) 0%, rgba(35, 12, 12, 0.9) 100%)'
              : 'rgba(18, 14, 11, 0.65)',
            border: isRedTurn
              ? redTime <= 30
                ? '2px solid #ef4444'
                : '2px solid #ffd700'
              : '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: isRedTurn
              ? '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(212, 175, 55, 0.15)'
              : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          {/* Progress bar background */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              width: `${redPercent}%`,
              background: redTime <= 30 ? '#ef4444' : '#10b981',
              transition: 'width 1s linear'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔴 {redPlayerName}
            </span>
            {isRedTurn && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#fff',
                  background: '#dc2626',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  animation: 'pulse 1s infinite'
                }}
              >
                ĐANG ĐI
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: redTime <= 30 ? '#ef4444' : '#fff',
              textShadow: isRedTurn ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
              lineHeight: 1.1
            }}
          >
            {formatTime(redTime)}
          </div>

          <div style={{ fontSize: '0.68rem', color: '#a89a8c', marginTop: '3px' }}>
            Nước đi: <strong style={{ color: isRedTurn && turnTime <= 15 ? '#ef4444' : '#ffd700' }}>{isRedTurn ? `${turnTime}s` : '60s'}</strong>
          </div>
        </div>

        {/* Black Player Clock */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '0.75rem',
            borderRadius: '10px',
            background: !isRedTurn
              ? 'linear-gradient(135deg, rgba(35, 30, 24, 0.9) 0%, rgba(20, 16, 12, 0.9) 100%)'
              : 'rgba(18, 14, 11, 0.65)',
            border: !isRedTurn
              ? blackTime <= 30
                ? '2px solid #ef4444'
                : '2px solid #ffd700'
              : '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: !isRedTurn
              ? '0 0 20px rgba(212, 175, 55, 0.35), inset 0 0 15px rgba(212, 175, 55, 0.15)'
              : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          {/* Progress bar background */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              width: `${blackPercent}%`,
              background: blackTime <= 30 ? '#ef4444' : '#10b981',
              transition: 'width 1s linear'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fef08a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚫ {blackPlayerName}
            </span>
            {!isRedTurn && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#1a1005',
                  background: '#ffd700',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  animation: 'pulse 1s infinite'
                }}
              >
                ĐANG ĐI
              </span>
            )}
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '1px',
              color: blackTime <= 30 ? '#ef4444' : '#fff',
              textShadow: !isRedTurn ? '0 0 12px rgba(212, 175, 55, 0.5)' : 'none',
              lineHeight: 1.1
            }}
          >
            {formatTime(blackTime)}
          </div>

          <div style={{ fontSize: '0.68rem', color: '#a89a8c', marginTop: '3px' }}>
            Nước đi: <strong style={{ color: !isRedTurn && turnTime <= 15 ? '#ef4444' : '#ffd700' }}>{!isRedTurn ? `${turnTime}s` : '60s'}</strong>
          </div>
        </div>
      </div>

      {/* Rules Notice Badge */}
      <div
        style={{
          marginTop: '0.65rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.68rem',
          color: '#8c7d6e',
          background: 'rgba(0,0,0,0.3)',
          padding: '0.3rem 0.6rem',
          borderRadius: '6px'
        }}
      >
        <Award size={12} color="#d4af37" />
        <span>Luật Quốc Tế (WXF): Hết giờ bị xử thua rụng kim. Thắng: <strong>+2 điểm</strong>, Hòa: <strong>+1 điểm</strong>.</span>
      </div>
    </div>
  );
}
