import * as signalR from '@microsoft/signalr';
import { getBackendUrl } from './apiService';

class SignalRService {
  constructor() {
    this.connection = null;
    this.startPromise = null;
    this.handlers = new Map();
  }

  async ensureConnected() {
    // If already connected, return existing connection
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    // If currently starting, wait for the existing promise to avoid race conditions
    if (this.startPromise) {
      return this.startPromise;
    }

    // If connection exists and is connecting/reconnecting, wait for it
    if (
      this.connection &&
      (this.connection.state === signalR.HubConnectionState.Connecting ||
        this.connection.state === signalR.HubConnectionState.Reconnecting)
    ) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
          if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
            resolve(this.connection);
          } else if (!this.connection || this.connection.state === signalR.HubConnectionState.Disconnected) {
            this.startPromise = null;
            this.ensureConnected().then(resolve).catch(reject);
          } else if (attempts++ > 40) {
            reject(new Error('Kết nối tới máy chủ SignalR quá thời gian. Vui lòng thử lại!'));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }

    // Create and start new connection
    this.startPromise = (async () => {
      try {
        if (!this.connection) {
          const hubUrl = `${getBackendUrl()}/gameHub`;
          this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
              // Support WebSockets with graceful fallback to ServerSentEvents and LongPolling
              transport:
                signalR.HttpTransportType.WebSockets |
                signalR.HttpTransportType.ServerSentEvents |
                signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

          // Register all accumulated event handlers
          for (const [event, callbacks] of this.handlers.entries()) {
            for (const cb of callbacks) {
              this.connection.on(event, cb);
            }
          }

          this.connection.onclose(() => {
            this.startPromise = null;
          });
        }

        if (this.connection.state === signalR.HubConnectionState.Disconnected) {
          await this.connection.start();
          console.log('SignalR connected successfully (state: Connected)');
        }

        return this.connection;
      } catch (err) {
        console.error('SignalR start error: ', err);
        this.startPromise = null;
        throw err;
      } finally {
        this.startPromise = null;
      }
    })();

    return this.startPromise;
  }

  // Alias for backward compatibility
  async startConnection() {
    return this.ensureConnected();
  }

  // Safe invoke with guaranteed connection check
  async safeInvoke(methodName, ...args) {
    await this.ensureConnected();

    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      // Small buffer wait in case transition is finalizing
      let attempts = 0;
      while (attempts < 25 && this.connection?.state !== signalR.HubConnectionState.Connected) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error('Chưa kết nối được tới máy chủ cờ tướng. Vui lòng thử lại sau 2 giây.');
      }
    }

    return this.connection.invoke(methodName, ...args);
  }

  on(event, callback) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(callback);

    if (this.connection) {
      this.connection.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).delete(callback);
    }
    if (this.connection) {
      this.connection.off(event, callback);
    }
  }

  async createRoom(playerName, username, roomName, playAsRed = true, isAiGame = false, aiDifficulty = 'Medium', isHandicap = false, removedPositions = []) {
    return this.safeInvoke('CreateRoom', {
      playerName,
      username,
      roomName,
      playAsRed,
      isAiGame,
      aiDifficulty,
      isHandicap,
      removedPositions
    });
  }

  async joinRoom(roomId, playerName, username) {
    return this.safeInvoke('JoinRoom', { roomId, playerName, username });
  }

  async makeMove(roomId, from, to) {
    return this.safeInvoke('MakeMove', { roomId, from, to });
  }

  async sendChat(roomId, sender, message) {
    return this.safeInvoke('SendChat', roomId, sender, message);
  }

  async resign(roomId, color) {
    return this.safeInvoke('Resign', roomId, color);
  }

  async reportTimeout(roomId, timedOutColor) {
    return this.safeInvoke('ReportTimeout', roomId, timedOutColor);
  }

  async offerDraw(roomId, color) {
    return this.safeInvoke('OfferDraw', roomId, color);
  }

  async respondDraw(roomId, accept) {
    return this.safeInvoke('RespondDraw', roomId, accept);
  }

  async requestRematch(roomId) {
    return this.safeInvoke('RequestRematch', roomId);
  }

  async setPlayerReady(roomId, role, playerName) {
    return this.safeInvoke('SetPlayerReady', roomId, role, playerName);
  }

  async registerUser(username, displayName) {
    return this.safeInvoke('RegisterUser', username, displayName);
  }

  async sendLobbyChat(sender, message) {
    return this.safeInvoke('SendLobbyChat', sender, message);
  }

  async inviteFriendToPlay(targetUsername, roomId) {
    return this.safeInvoke('InviteFriendToPlay', targetUsername, roomId);
  }

  async respondChallenge(inviterUsername, roomId, accept) {
    return this.safeInvoke('RespondChallenge', inviterUsername, roomId, accept);
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (_) {}
      this.connection = null;
      this.startPromise = null;
    }
  }
}

export const signalRService = new SignalRService();
