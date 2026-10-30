// REST API client for Xiangqi .NET 9.0 Backend

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '')
  : '';

const API_BASE = `${BACKEND_URL}/api/game`;
const AUTH_BASE = `${BACKEND_URL}/api/auth`;
const FRIEND_BASE = `${BACKEND_URL}/api/friend`;

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  const token = localStorage.getItem('xiangqi_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const apiService = {
  // Game Endpoints
  async getNewGame() {
    const res = await fetch(`${API_BASE}/new`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải bàn cờ mới');
    return res.json();
  },

  async getLegalMoves(gameState, position) {
    const res = await fetch(`${API_BASE}/legal-moves`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameState, position })
    });
    if (!res.ok) throw new Error('Lỗi lấy danh sách nước đi');
    return res.json();
  },

  async makeMove(gameState, from, to) {
    const res = await fetch(`${API_BASE}/move`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameState, from, to })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Nước đi không hợp lệ');
    }
    return res.json();
  },

  async getAiMove(gameState, difficulty = 'Medium') {
    const res = await fetch(`${API_BASE}/ai-move`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameState, difficulty })
    });
    if (!res.ok) throw new Error('Lỗi tính toán nước đi của AI');
    return res.json();
  },

  async getRooms() {
    const res = await fetch(`${API_BASE}/rooms`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải danh sách phòng');
    return res.json();
  },

  async createRoom(playerName, username, roomName, playAsRed = true, isAiGame = false, aiDifficulty = 'Medium', isHandicap = false, removedPositions = []) {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ playerName, username, roomName, playAsRed, isAiGame, aiDifficulty, isHandicap, removedPositions })
    });
    if (!res.ok) throw new Error('Không thể tạo phòng mới');
    return res.json();
  },

  async getRoom(roomId) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không tìm thấy phòng');
    return res.json();
  },

  // Auth Endpoints
  async login(username, password) {
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Đăng nhập không thành công');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('xiangqi_token', data.token);
      localStorage.setItem('xiangqi_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(username, password, displayName) {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ username, password, displayName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Đăng ký không thành công');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('xiangqi_token', data.token);
      localStorage.setItem('xiangqi_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getLeaderboard() {
    const res = await fetch(`${AUTH_BASE}/leaderboard`);
    if (!res.ok) throw new Error('Không thể tải bảng xếp hạng');
    return res.json();
  },

  // Friend Endpoints
  async getFriends() {
    const res = await fetch(`${FRIEND_BASE}/list`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải danh sách bạn bè');
    return res.json();
  },

  async getFriendRequests() {
    const res = await fetch(`${FRIEND_BASE}/requests`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không thể tải lời mời kết bạn');
    return res.json();
  },

  async sendFriendRequest(targetUsername) {
    const res = await fetch(`${FRIEND_BASE}/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetUsername })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi gửi lời mời kết bạn');
    }
    return res.json();
  },

  async acceptFriendRequest(requestId) {
    const res = await fetch(`${FRIEND_BASE}/accept/${requestId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi chấp nhận kết bạn');
    }
    return res.json();
  },

  async rejectFriendRequest(requestId) {
    const res = await fetch(`${FRIEND_BASE}/reject/${requestId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi từ chối kết bạn');
    }
    return res.json();
  },

  async removeFriend(targetUserId) {
    const res = await fetch(`${FRIEND_BASE}/${targetUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi hủy kết bạn');
    }
    return res.json();
  },

  logout() {
    localStorage.removeItem('xiangqi_token');
    localStorage.removeItem('xiangqi_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('xiangqi_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
