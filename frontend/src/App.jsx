import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import GameControls from './components/GameControls';
import GameInfo from './components/GameInfo';
import MoveHistory from './components/MoveHistory';
import OnlineRoomModal from './components/OnlineRoomModal';
import GameOverModal from './components/GameOverModal';
import AuthModal from './components/AuthModal';
import LeaderboardModal from './components/LeaderboardModal';
import FriendsModal from './components/FriendsModal';
import ChallengeModal from './components/ChallengeModal';
import Lobby from './components/Lobby';
import TurnToast from './components/TurnToast';
import ChessClock from './components/ChessClock';
import { apiService } from './services/apiService';
import { signalRService } from './services/signalrService';
import { audio } from './services/audioService';
import { getClientLegalMoves } from './utils/xiangqiLogic';
import { Send, MessageSquare, Trophy, User, LogOut, Swords, ArrowLeft, Users } from 'lucide-react';

export default function App() {
  // Navigation View: 'lobby' (Home Page) vs 'game' (Chess Arena)
  const [viewMode, setViewMode] = useState('lobby');

  const [gameState, setGameState] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameMode, setGameMode] = useState('ai'); // 'ai', 'local', 'online'
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // User Authentication & Leaderboard
  const [currentUser, setCurrentUser] = useState(() => apiService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Friends & Social State
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  // Online Multiplayer State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineRoomId, setOnlineRoomId] = useState(null);
  const [onlineRole, setOnlineRole] = useState('Red'); // 'Red', 'Black', 'Observer'
  const [redPlayerName, setRedPlayerName] = useState('Kỳ Thủ Đỏ');
  const [blackPlayerName, setBlackPlayerName] = useState('Kỳ Thủ Đen');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [guestHandicapConfirmed, setGuestHandicapConfirmed] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  // 1. Initial Load: Fetch new game and proactively warm up SignalR connection
  const loadNewGame = useCallback(async () => {
    try {
      const data = await apiService.getNewGame();
      setGameState(data);
      setSelectedPos(null);
      setValidMoves([]);
      audio.playMoveSound();
    } catch (err) {
      console.error('Error fetching new game from backend:', err);
    }
  }, []);

  useEffect(() => {
    loadNewGame();
    // Proactively connect to SignalR so connection is 'Connected' before user actions
    signalRService.ensureConnected().catch((err) => {
      console.warn('Initial SignalR warm-up connection (will auto-reconnect):', err);
    });
  }, [loadNewGame]);

  // Register user presence with SignalR whenever user changes or connects
  useEffect(() => {
    if (currentUser) {
      signalRService.ensureConnected().then(() => {
        signalRService.registerUser(currentUser.username, currentUser.displayName);
      }).catch(() => {});

      // Load pending friend requests count
      apiService.getFriendRequests().then(reqs => {
        setFriendRequestsCount(reqs?.length || 0);
      }).catch(() => {});
    }
  }, [currentUser]);

  // 2. SignalR event listeners for online multiplayer & challenges
  useEffect(() => {
    const handleMoveMade = ({ move, gameState: newState }) => {
      setGameState(newState);
      setSelectedPos(null);
      setValidMoves([]);

      if (move?.capturedPiece) {
        audio.playCaptureSound();
      } else {
        audio.playMoveSound();
      }

      if (newState?.inCheck) {
        audio.playCheckSound();
      }
    };

    const handlePlayerJoined = (data) => {
      if (data.redPlayerName) setRedPlayerName(data.redPlayerName);
      if (data.blackPlayerName) setBlackPlayerName(data.blackPlayerName);
      if (data.role === 'Black' && data.playerName) setBlackPlayerName(data.playerName);
      if (data.role === 'Red' && data.playerName) setRedPlayerName(data.playerName);

      audio.playCheckSound();
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'Hệ Thống',
          message: `⚔️ ${data.playerName} đã tham gia với vai trò ${data.role === 'Red' ? 'Bên Đỏ' : 'Bên Đen'}!${data.isHandicap ? ' (Chế Độ Chấp Cờ)' : ''}`,
          timestamp: new Date()
        }
      ]);
    };

    const handlePlayerReady = (data) => {
      audio.playCheckSound();
      setOpponentReady(true);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'Hệ Thống',
          message: `✅ ${data.playerName} (${data.role === 'Black' ? 'Bên Đen' : 'Bên Đỏ'}) đã xem bàn cờ chấp và xác nhận: SẴN SÀNG THI ĐẤU!`,
          timestamp: new Date()
        }
      ]);
    };

    const handleChatMessage = (chat) => {
      setChatMessages(prev => [...prev, chat]);
    };

    const handleGameEnded = ({ reason, status, winner }) => {
      setGameState(prev => ({
        ...prev,
        status: status || 'Resigned',
        winner: winner || (onlineRole === 'Red' ? 'Black' : 'Red')
      }));
      setChatMessages(prev => [
        ...prev,
        { sender: 'Hệ Thống', message: reason || 'Ván đấu đã kết thúc!', timestamp: new Date() }
      ]);
    };

    const handleDrawOffered = async ({ roomId, offeringPlayerName, offeringColor }) => {
      const colorLabel = offeringColor === 'Red' ? 'Bên Đỏ' : 'Bên Đen';
      const accept = window.confirm(`${offeringPlayerName} (${colorLabel}) xin hòa cờ. Bạn có đồng ý hòa không?`);
      try {
        await signalRService.respondDraw(roomId, accept);
      } catch (err) {
        console.error('Lỗi phản hồi xin hòa:', err);
      }
    };

    const handleRematchStarted = ({ gameState: rematchState }) => {
      setGameState(rematchState);
      setSelectedPos(null);
      setValidMoves([]);
      audio.playMoveSound();
      setChatMessages(prev => [
        ...prev,
        { sender: 'Hệ Thống', message: 'Ván đấu mới đã bắt đầu!', timestamp: new Date() }
      ]);
    };

    // Room Entrance Listeners (Unified for Create & Join)
    const handleRoomEntered = (data) => {
      setOnlineRoomId(data.roomId);
      setOnlineRole(data.role);
      setIsFlipped(data.role === 'Black');
      setGameState(data.gameState);
      setRedPlayerName(data.redPlayerName || 'Kỳ Thủ Đỏ');
      setBlackPlayerName(data.blackPlayerName || 'Kỳ Thủ Đen');
      setGameMode('online');
      setIsOnlineModalOpen(false);
      setViewMode('game');

      if (data.role === 'Red' || !data.isHandicap) {
        setGuestHandicapConfirmed(true);
      } else {
        setGuestHandicapConfirmed(false);
      }
      setOpponentReady(false);

      if (data.isHandicap) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'Hệ Thống',
            message: '⚡ Trận đấu Chấp Cờ! Quân chấp đã được tự động loại bỏ khỏi bàn cờ theo cấu hình của Chủ phòng.',
            timestamp: new Date()
          }
        ]);
      }
    };

    // Friend Challenge Listeners
    const handleChallengeReceived = (challenge) => {
      audio.playCheckSound();
      setIncomingChallenge(challenge);
    };

    const handleChallengeDeclined = ({ message }) => {
      alert(message || 'Đối thủ đã từ chối lời mời!');
    };

    const handleChallengeAccepted = ({ roomId }) => {
      // Both sides enter arena
      setOnlineRoomId(roomId);
      setGameMode('online');
      setViewMode('game');
    };

    const handleFriendRequest = ({ fromDisplayName }) => {
      audio.playMoveSound();
      setFriendRequestsCount(prev => prev + 1);
      alert(`Bạn nhận được một lời mời kết bạn mới từ ${fromDisplayName}!`);
    };

    const handleServerError = (msg) => {
      alert(msg);
    };

    signalRService.on('MoveMade', handleMoveMade);
    signalRService.on('PlayerJoined', handlePlayerJoined);
    signalRService.on('PlayerReady', handlePlayerReady);
    signalRService.on('ChatMessageReceived', handleChatMessage);
    signalRService.on('GameEnded', handleGameEnded);
    signalRService.on('DrawOffered', handleDrawOffered);
    signalRService.on('RematchStarted', handleRematchStarted);
    signalRService.on('JoinedRoom', handleRoomEntered);
    signalRService.on('RoomCreated', handleRoomEntered);
    signalRService.on('ChallengeReceived', handleChallengeReceived);
    signalRService.on('ChallengeDeclined', handleChallengeDeclined);
    signalRService.on('ChallengeAccepted', handleChallengeAccepted);
    signalRService.on('FriendRequestReceived', handleFriendRequest);
    signalRService.on('Error', handleServerError);

    return () => {
      signalRService.off('MoveMade', handleMoveMade);
      signalRService.off('PlayerJoined', handlePlayerJoined);
      signalRService.off('PlayerReady', handlePlayerReady);
      signalRService.off('ChatMessageReceived', handleChatMessage);
      signalRService.off('GameEnded', handleGameEnded);
      signalRService.off('DrawOffered', handleDrawOffered);
      signalRService.off('RematchStarted', handleRematchStarted);
      signalRService.off('JoinedRoom', handleRoomEntered);
      signalRService.off('RoomCreated', handleRoomEntered);
      signalRService.off('ChallengeReceived', handleChallengeReceived);
      signalRService.off('ChallengeDeclined', handleChallengeDeclined);
      signalRService.off('ChallengeAccepted', handleChallengeAccepted);
      signalRService.off('FriendRequestReceived', handleFriendRequest);
      signalRService.off('Error', handleServerError);
    };
  }, [onlineRole]);

  // 3. User clicks on square / piece
  const handleSquareClick = async (r, c) => {
    if (!gameState) return;
    if (isAiThinking) return;

    if (['Checkmate', 'Stalemate', 'Resigned', 'Draw'].includes(gameState.status)) {
      return;
    }

    if (gameMode === 'online') {
      if (onlineRole === 'Observer') return;
      if (gameState.currentTurn !== onlineRole) return;
      if (gameState?.isHandicap && onlineRole !== 'Red' && !guestHandicapConfirmed) {
        alert('Vui lòng kiểm tra bàn cờ và bấm nút "Đồng Ý & Sẵn Sàng" phía trên trước khi đánh!');
        return;
      }
    }

    const clickedPiece = gameState.board[r]?.[c];
    const isDestination = validMoves.some(m => m.row === r && m.col === c);

    if (selectedPos && isDestination) {
      await executeMove(selectedPos, { row: r, col: c });
      return;
    }

    const currentSide = gameState.currentTurn;
    if (clickedPiece && clickedPiece.color === currentSide) {
      if (gameMode === 'online' && clickedPiece.color !== onlineRole) return;

      setSelectedPos({ row: r, col: c });
      audio.init();

      const moves = getClientLegalMoves(gameState.board, { row: r, col: c });
      setValidMoves(moves);
      return;
    }

    setSelectedPos(null);
    setValidMoves([]);
  };

  // 4. Execute a Move
  const executeMove = async (from, to) => {
    try {
      if (gameMode === 'online' && onlineRoomId) {
        await signalRService.makeMove(onlineRoomId, from, to);
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }

      const result = await apiService.makeMove(gameState, from, to);
      const updatedState = result.gameState;
      const move = result.move;

      setGameState(updatedState);
      setSelectedPos(null);
      setValidMoves([]);

      if (move.capturedPiece) {
        audio.playCaptureSound();
      } else {
        audio.playMoveSound();
      }

      if (updatedState.inCheck) {
        audio.playCheckSound();
      }

      // If AI mode and it's AI turn, trigger AI move
      if (gameMode === 'ai' && updatedState.currentTurn === 'Black' && updatedState.status === 'Ongoing') {
        setIsAiThinking(true);
        setTimeout(async () => {
          try {
            const aiRes = await apiService.getAiMove(updatedState, aiDifficulty);
            if (aiRes.move) {
              setGameState(aiRes.gameState);
              if (aiRes.move.capturedPiece) {
                audio.playCaptureSound();
              } else {
                audio.playMoveSound();
              }
              if (aiRes.gameState.inCheck) {
                audio.playCheckSound();
              }
            }
          } catch (err) {
            console.error('AI Move Error:', err);
          } finally {
            setIsAiThinking(false);
          }
        }, 300);
      }
    } catch (err) {
      console.error('Make Move Error:', err);
    }
  };

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audio.playMoveSound();
    }
  };

  // Launch Game Modes from Lobby
  const handleStartAiGame = (difficulty) => {
    setAiDifficulty(difficulty);
    setGameMode('ai');
    setIsFlipped(false);
    loadNewGame();
    setViewMode('game');
  };

  const handleStartLocalGame = () => {
    setGameMode('local');
    setIsFlipped(false);
    loadNewGame();
    setViewMode('game');
  };

  const handleQuickMatch = async () => {
    try {
      const rooms = await apiService.getRooms();
      const waitingRoom = rooms.find(r => (!r.hasRedPlayer || !r.hasBlackPlayer));

      const playerName = currentUser?.displayName || localStorage.getItem('xiangqi_player_name') || `KỳThủ_${Math.floor(Math.random() * 900 + 100)}`;
      const username = currentUser?.username || null;

      if (waitingRoom) {
        await handleJoinOnlineRoom(waitingRoom.roomId, playerName, username);
      } else {
        // Create a new public room
        await handleCreateOnlineRoom(playerName, username, 'Giao Lưu Kỳ Thủ', true);
      }
    } catch (err) {
      console.error('Quick match error:', err);
    }
  };

  const handleConfirmHandicapReady = async () => {
    setGuestHandicapConfirmed(true);
    const myName = currentUser?.displayName || localStorage.getItem('xiangqi_player_name') || blackPlayerName || 'Kỳ Thủ Đen';
    try {
      await signalRService.setPlayerReady(onlineRoomId, onlineRole, myName);
    } catch (err) {
      console.error('Error confirming handicap ready:', err);
    }
  };

  const handleCreateOnlineRoom = async (playerName, username, roomName, playAsRed, isHandicap = false, removedPositions = [], isAiGame = false) => {
    try {
      const pName = playerName || currentUser?.displayName || localStorage.getItem('xiangqi_player_name') || 'Kỳ Thủ';
      const uName = username || currentUser?.username || null;
      await signalRService.createRoom(pName, uName, roomName, playAsRed, isAiGame, 'Medium', isHandicap, removedPositions);
    } catch (err) {
      alert('Không thể tạo phòng: ' + err.message);
    }
  };

  const handleJoinOnlineRoom = async (roomId, playerName, username) => {
    try {
      const pName = playerName || currentUser?.displayName || localStorage.getItem('xiangqi_player_name') || `KỳThủ_${Math.floor(Math.random() * 900 + 100)}`;
      const uName = username || currentUser?.username || null;
      await signalRService.joinRoom(roomId, pName, uName);
    } catch (err) {
      alert('Không thể kết nối vào phòng: ' + err.message);
    }
  };

  // Direct Challenge to an online friend
  const handleInviteFriendDirectly = async (targetUsername, targetDisplayName) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const roomName = `Tỉ Thí: ${currentUser.displayName} vs ${targetDisplayName}`;
    try {
      const room = await apiService.createRoom(currentUser.displayName, currentUser.username, roomName, true, false);
      setOnlineRoomId(room.roomId);
      setOnlineRole('Red');
      setIsFlipped(false);
      setGameState(room.gameState);
      setRedPlayerName(room.redPlayerName);
      setBlackPlayerName(targetDisplayName);
      setGameMode('online');
      setViewMode('game');

      await signalRService.joinRoom(room.roomId, currentUser.displayName, currentUser.username);
      await signalRService.inviteFriendToPlay(targetUsername, room.roomId);
      alert(`Đã gửi lời mời tỉ thí tới ${targetDisplayName}! Đang chờ đối thủ vào phòng #${room.roomId}...`);
    } catch (err) {
      alert('Lỗi tạo phòng khiêu chiến: ' + err.message);
    }
  };

  const handleAcceptChallenge = async (challenge) => {
    try {
      const playerName = currentUser?.displayName || 'Kỳ Thủ';
      const username = currentUser?.username || null;

      await signalRService.respondChallenge(challenge.inviterUsername, challenge.roomId, true);
      await handleJoinOnlineRoom(challenge.roomId, playerName, username);
      setIncomingChallenge(null);
    } catch (err) {
      alert('Lỗi ứng chiến: ' + err.message);
    }
  };

  const handleDeclineChallenge = async (challenge) => {
    try {
      await signalRService.respondChallenge(challenge.inviterUsername, challenge.roomId, false);
      setIncomingChallenge(null);
    } catch (err) {
      console.error('Error declining challenge:', err);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !onlineRoomId) return;
    const sender = onlineRole === 'Red' ? redPlayerName : blackPlayerName;
    await signalRService.sendChat(onlineRoomId, sender, chatInput);
    setChatInput('');
  };

  const handleNewGame = async () => {
    if (gameMode === 'online' && onlineRoomId) {
      if (window.confirm('Khởi động lại ván cờ mới cho phòng đấu này?')) {
        try {
          await signalRService.requestRematch(onlineRoomId);
        } catch (err) {
          alert('Không thể tạo ván mới: ' + err.message);
        }
      }
    } else {
      if (window.confirm('Bắt đầu ván cờ mới?')) {
        await loadNewGame();
      }
    }
  };

  const handleResign = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xin nhận thua ván cờ này?')) return;
    if (gameMode === 'online' && onlineRoomId) {
      try {
        await signalRService.resign(onlineRoomId, onlineRole);
      } catch (err) {
        alert('Lỗi gửi xin thua: ' + err.message);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        status: 'Resigned',
        winner: prev.currentTurn === 'Red' ? 'Black' : 'Red'
      }));
    }
  };

  const handleOfferDraw = async () => {
    if (gameMode === 'online' && onlineRoomId) {
      if (window.confirm('Bạn có muốn gửi lời đề nghị hòa cờ tới đối thủ?')) {
        try {
          await signalRService.offerDraw(onlineRoomId, onlineRole);
          alert('Đã gửi lời đề nghị hòa cờ tới đối thủ. Vui lòng chờ phản hồi!');
        } catch (err) {
          alert('Lỗi gửi yêu cầu hòa: ' + err.message);
        }
      }
    } else {
      if (window.confirm('Hai bên đồng ý hòa cờ?')) {
        setGameState(prev => ({
          ...prev,
          status: 'Draw'
        }));
      }
    }
  };

  const handleTimeout = async (timedOutColor) => {
    const winnerColor = timedOutColor === 'Red' ? 'Black' : 'Red';
    if (gameMode === 'online' && onlineRoomId) {
      try {
        await signalRService.reportTimeout(onlineRoomId, timedOutColor);
      } catch (err) {
        console.error('Lỗi gửi timeout tới server:', err);
      }
    } else {
      setGameState(prev => ({
        ...prev,
        status: 'Timeout',
        winner: winnerColor
      }));
    }
  };

  const effectiveRedName = gameMode === 'online' ? redPlayerName : (currentUser?.displayName || 'Kỳ Thủ Đỏ');
  const effectiveBlackName = gameMode === 'ai' ? `Máy (${aiDifficulty})` : gameMode === 'online' ? blackPlayerName : 'Kỳ Thủ Đen';

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
  };

  const lastMove = gameState?.moveHistory?.length
    ? gameState.moveHistory[gameState.moveHistory.length - 1]
    : null;

  return (
    <div className="app-container">
      {/* 1. LOBBY / TRANG CHỦ VIEW */}
      {viewMode === 'lobby' ? (
        <Lobby
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onStartAiGame={handleStartAiGame}
          onStartLocalGame={handleStartLocalGame}
          onOpenCreateRoom={() => setIsOnlineModalOpen(true)}
          onJoinRoom={(roomId, pName, uName) => handleJoinOnlineRoom(roomId, pName, uName)}
          onQuickMatch={handleQuickMatch}
          isMuted={isMuted}
          onToggleMute={handleToggleSound}
          friendRequestsCount={friendRequestsCount}
          onInviteFriendDirectly={handleInviteFriendDirectly}
        />
      ) : (
        /* 2. CHESS ARENA VIEW */
        <>
          {/* Header */}
          <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="back-to-lobby-btn"
                onClick={() => setViewMode('lobby')}
                title="Quay lại sảnh chính"
              >
                <ArrowLeft size={16} />
                <span>Về Sảnh Chờ</span>
              </button>

              <div className="logo-group">
                <div className="logo-badge">帥</div>
                <div className="logo-text">
                  <h1>KỲ VƯƠNG</h1>
                  <span>
                    {gameMode === 'online' ? `Phòng #${onlineRoomId || '---'}` : gameMode === 'ai' ? `Luyện Cờ Với AI (${aiDifficulty})` : 'Chơi 2 Người Cùng Máy'}
                  </span>
                </div>
              </div>
            </div>

            <div className="header-actions">
              {/* Friends Button */}
              <button
                className="btn btn-dark"
                onClick={() => setIsFriendsOpen(true)}
                title="Bạn Bè"
              >
                <Users size={16} color="#ffd700" />
                <span>Bạn Bè</span>
                {friendRequestsCount > 0 && (
                  <span style={{ background: '#dc2626', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {friendRequestsCount}
                  </span>
                )}
              </button>

              {/* Leaderboard Button */}
              <button
                className="btn btn-dark"
                onClick={() => setIsLeaderboardOpen(true)}
                title="Bảng Xếp Hạng Kỳ Thủ"
              >
                <Trophy size={16} color="#ffd700" />
                <span>Xếp Hạng</span>
              </button>

              {/* User Account / Profile Button */}
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#d4af37', color: '#1a1005', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {currentUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fef08a' }}>
                      {currentUser.displayName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#ffd700', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '10px' }}>
                      ⭐ {currentUser.eloRating}
                    </div>
                  </div>

                  <button className="btn-icon" onClick={handleLogout} title="Đăng xuất">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-dark" onClick={() => setIsAuthModalOpen(true)}>
                  <User size={16} />
                  <span>Đăng Nhập</span>
                </button>
              )}

              {/* Online Match Button */}
              <button className="btn btn-gold" onClick={() => setIsOnlineModalOpen(true)}>
                <Swords size={16} />
                <span>Đổi Phòng</span>
              </button>
            </div>
          </header>

          {/* Turn Notification Popup Banner */}
          <TurnToast
            currentTurn={gameState?.currentTurn}
            redPlayerName={effectiveRedName}
            blackPlayerName={effectiveBlackName}
            isAiTurn={gameMode === 'ai' && gameState?.currentTurn === 'Black'}
            isMyTurn={
              gameMode === 'online'
                ? gameState?.currentTurn === onlineRole
                : gameMode === 'ai'
                ? gameState?.currentTurn === 'Red'
                : true
            }
            gameMode={gameMode}
          />

          {/* Main Game Arena */}
          <main className="main-content">
            {/* Left: Xiangqi Board Area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '620px' }}>
              {/* Opponent Handicap Confirmation Banner */}
              {gameState?.isHandicap && gameMode === 'online' && onlineRole !== 'Red' && (
                <div style={{
                  width: '100%',
                  marginBottom: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  background: guestHandicapConfirmed
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'linear-gradient(135deg, rgba(40, 20, 10, 0.95), rgba(70, 25, 10, 0.95))',
                  border: guestHandicapConfirmed
                    ? '1px solid rgba(34, 197, 94, 0.5)'
                    : '2px solid #eab308',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: guestHandicapConfirmed ? '#86efac' : '#fde047', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>⚡ {guestHandicapConfirmed ? 'ĐÃ ĐỒNG Ý BÀN CỜ CHẤP' : 'BÀN CỜ CHẤP CỦA CHỦ PHÒNG (READ-ONLY)'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#d1c5b8', marginTop: '2px' }}>
                      {guestHandicapConfirmed
                        ? 'Bạn đã sẵn sàng thi đấu. Chúc bạn có trận đấu thú vị!'
                        : 'Các quân chấp đã được lược bỏ. Xem bàn cờ và nhấn Sẵn Sàng để đánh.'}
                    </div>
                  </div>
                  {!guestHandicapConfirmed && (
                    <button
                      onClick={handleConfirmHandicapReady}
                      className="btn btn-gold"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                      Đồng Ý & Sẵn Sàng
                    </button>
                  )}
                </div>
              )}

              {/* Host waiting for opponent readiness notification */}
              {gameState?.isHandicap && gameMode === 'online' && onlineRole === 'Red' && !opponentReady && (
                <div style={{
                  width: '100%',
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px dashed rgba(234, 179, 8, 0.4)',
                  fontSize: '0.78rem',
                  color: '#fef08a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚡ Đang chờ đối thủ xem xét bàn cờ chấp và xác nhận Sẵn sàng...</span>
                </div>
              )}

              <Board
                gameState={gameState}
                selectedPos={selectedPos}
                validMoves={validMoves}
                lastMove={lastMove}
                isFlipped={isFlipped}
                showVietnamese={showVietnamese}
                onSquareClick={handleSquareClick}
              />
            </div>

            {/* Right: Dashboard Controls, Game Info & Moves Log */}
            <aside className="side-panel">
              {/* International Dual Chess Clock */}
              <ChessClock
                currentTurn={gameState?.currentTurn}
                status={gameState?.status}
                redPlayerName={effectiveRedName}
                blackPlayerName={effectiveBlackName}
                onTimeout={handleTimeout}
                gameMode={gameMode}
                fullmoveNumber={gameState?.fullmoveNumber || 1}
              />

              <GameInfo
                gameState={gameState}
                redPlayerName={effectiveRedName}
                blackPlayerName={effectiveBlackName}
              />

              <GameControls
                gameMode={gameMode}
                setGameMode={setGameMode}
                aiDifficulty={aiDifficulty}
                setAiDifficulty={setAiDifficulty}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                showVietnamese={showVietnamese}
                setShowVietnamese={setShowVietnamese}
                isMuted={isMuted}
                onToggleSound={handleToggleSound}
                onNewGame={handleNewGame}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                onlineRoomId={onlineRoomId}
                onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
                isAiThinking={isAiThinking}
              />

              <MoveHistory moveHistory={gameState?.moveHistory || []} />

              {/* In-Game Chat for Online Rooms */}
              {gameMode === 'online' && onlineRoomId && (
                <div className="dashboard-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffd700', fontSize: '0.85rem', fontWeight: 700 }}>
                    <MessageSquare size={16} />
                    <span>Trò Chuyện Trong Phòng</span>
                  </div>
                  <div className="chat-box">
                    <div className="chat-messages">
                      {chatMessages.length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: '#665' }}>Chưa có tin nhắn...</span>
                      ) : (
                        chatMessages.map((m, idx) => (
                          <div key={idx} className="chat-msg">
                            <span className="sender">{m.sender}:</span>
                            <span>{m.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <form className="chat-input-row" onSubmit={handleSendChat}>
                      <input
                        className="chat-input"
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Gửi lời chào..."
                        maxLength={100}
                      />
                      <button type="submit" className="btn btn-gold" style={{ padding: '0.35rem 0.65rem' }}>
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </aside>
          </main>
        </>
      )}

      {/* Online Room Modal */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        currentUser={currentUser}
        onClose={() => setIsOnlineModalOpen(false)}
        onCreateRoom={handleCreateOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
      />

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        currentUser={currentUser}
        onClose={() => setIsFriendsOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onInviteFriend={handleInviteFriendDirectly}
      />

      {/* Incoming Challenge Realtime Modal */}
      <ChallengeModal
        challenge={incomingChallenge}
        onAccept={handleAcceptChallenge}
        onDecline={handleDeclineChallenge}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={user => {
          setCurrentUser(user);
          signalRService.registerUser(user.username, user.displayName);
        }}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Game Over Celebration / Loss Modal */}
      <GameOverModal
        status={gameState?.status}
        winner={gameState?.winner}
        userColor={gameMode === 'online' ? onlineRole : 'Red'}
        onNewGame={loadNewGame}
        onRematch={loadNewGame}
      />
    </div>
  );
}
