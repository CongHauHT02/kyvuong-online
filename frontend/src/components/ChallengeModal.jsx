import React, { useEffect, useState } from 'react';
import { Swords, X, Check, Clock } from 'lucide-react';

export default function ChallengeModal({ challenge, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!challenge) return;
    setTimeLeft(30);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(challenge);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge, onDecline]);

  if (!challenge) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', border: '2px solid #ffd700', boxShadow: '0 0 35px rgba(212, 175, 55, 0.4)' }}>
        {/* Header */}
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={18} />
            </div>
            <h2 style={{ fontSize: '1.2rem', color: '#ffd700', margin: 0 }}>THƯ KHIÊU CHIẾN!</h2>
          </div>
          <button
            onClick={() => onDecline(challenge)}
            className="btn-icon"
            style={{ position: 'absolute', right: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fef3c7, #ecd09f, #b8860b)', border: '2px solid #ffd700', color: '#1a1005', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-title)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}>
            {challenge.inviterDisplayName ? challenge.inviterDisplayName.charAt(0).toUpperCase() : 'K'}
          </div>

          <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, margin: '0 0 4px 0' }}>
            {challenge.inviterDisplayName}
          </h3>
          <div style={{ fontSize: '0.75rem', color: '#ffd700', marginBottom: '1rem' }}>
            @{challenge.inviterUsername}
          </div>

          <div style={{ background: 'rgba(15, 12, 9, 0.8)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.82rem', color: '#d1c5b8', marginBottom: '1rem' }}>
            Mời bạn tham gia tỉ thí tại phòng: <strong style={{ color: '#ffd700' }}>#{challenge.roomId}</strong>
            <div style={{ fontSize: '0.75rem', color: '#887', marginTop: '4px', fontStyle: 'italic' }}>
              "{challenge.roomName}"
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.78rem', color: '#a89a8c' }}>
            <Clock size={13} color="#ffd700" />
            <span>Tự động từ chối sau: <strong style={{ color: '#ffd700' }}>{timeLeft}s</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={() => onDecline(challenge)}
            className="btn btn-dark"
            style={{ justifyContent: 'center', padding: '0.65rem' }}
          >
            <X size={15} />
            <span>Từ Chối</span>
          </button>
          <button
            onClick={() => onAccept(challenge)}
            className="btn btn-gold"
            style={{ justifyContent: 'center', padding: '0.65rem', fontWeight: 800 }}
          >
            <Check size={16} />
            <span>Ứng Chiến Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
