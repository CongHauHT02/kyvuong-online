using Microsoft.AspNetCore.SignalR;
using XiangqiBackend.DTOs;
using XiangqiBackend.Models;
using XiangqiBackend.Services;

namespace XiangqiBackend.Hubs;

public class GameHub(
    RoomManagerService roomManager,
    XiangqiRulesService rulesService,
    XiangqiAiService aiService,
    AuthService authService,
    UserPresenceService presenceService) : Hub
{
    // ==========================================
    // USER PRESENCE & IDENTITY
    // ==========================================
    public async Task RegisterUser(string username, string displayName)
    {
        if (string.IsNullOrWhiteSpace(username)) return;
        presenceService.UserConnected(username, Context.ConnectionId);

        // Notify all clients that a user came online
        await Clients.Others.SendAsync("UserPresenceChanged", new
        {
            Username = username.Trim().ToLowerInvariant(),
            DisplayName = displayName,
            IsOnline = true
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        presenceService.UserDisconnected(Context.ConnectionId, out var disconnectedUser);
        if (!string.IsNullOrEmpty(disconnectedUser))
        {
            await Clients.Others.SendAsync("UserPresenceChanged", new
            {
                Username = disconnectedUser,
                IsOnline = false
            });
        }
        await base.OnDisconnectedAsync(exception);
    }

    // ==========================================
    // LOBBY & WORLD CHAT
    // ==========================================
    public async Task SendLobbyChat(string sender, string message)
    {
        if (string.IsNullOrWhiteSpace(message)) return;
        var chatMsg = new ChatMessageDto(sender, message.Trim(), DateTime.UtcNow);
        await Clients.All.SendAsync("LobbyChatMessageReceived", chatMsg);
    }

    // ==========================================
    // FRIEND INVITATION & CHALLENGES
    // ==========================================
    public async Task InviteFriendToPlay(string targetUsername, string roomId)
    {
        if (string.IsNullOrWhiteSpace(targetUsername) || string.IsNullOrWhiteSpace(roomId)) return;

        var room = roomManager.GetRoom(roomId);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Không tìm thấy phòng thi đấu!");
            return;
        }

        var targetConnections = presenceService.GetConnectionIdsForUser(targetUsername);
        if (targetConnections.Count == 0)
        {
            await Clients.Caller.SendAsync("Error", "Người bạn này hiện không online trong trò chơi!");
            return;
        }

        var inviterName = room.RedPlayerName ?? room.BlackPlayerName ?? "Kỳ Thủ";

        foreach (var connId in targetConnections)
        {
            await Clients.Client(connId).SendAsync("ChallengeReceived", new
            {
                InviterUsername = room.RedUsername ?? room.BlackUsername ?? "Guest",
                InviterDisplayName = inviterName,
                RoomId = room.RoomId,
                RoomName = room.RoomName
            });
        }

        await Clients.Caller.SendAsync("ChallengeSent", new
        {
            TargetUsername = targetUsername,
            Message = $"Đã gửi lời mời tỉ thí tới {targetUsername}!"
        });
    }

    public async Task RespondChallenge(string inviterUsername, string roomId, bool accept)
    {
        var inviterConnections = presenceService.GetConnectionIdsForUser(inviterUsername);

        if (!accept)
        {
            foreach (var connId in inviterConnections)
            {
                await Clients.Client(connId).SendAsync("ChallengeDeclined", new
                {
                    RoomId = roomId,
                    Message = "Đối thủ đã từ chối lời mời tỉ thí!"
                });
            }
            return;
        }

        // If accepted, tell both sides to proceed
        foreach (var connId in inviterConnections)
        {
            await Clients.Client(connId).SendAsync("ChallengeAccepted", new
            {
                RoomId = roomId
            });
        }
    }

    // ==========================================
    // ROOM MANAGEMENT
    // ==========================================
    public async Task CreateRoom(CreateRoomRequest request)
    {
        var room = roomManager.CreateRoom(
            request.PlayerName,
            request.Username,
            request.RoomName,
            request.PlayAsRed,
            request.IsAiGame,
            request.AiDifficulty
        );

        if (request.PlayAsRed)
        {
            room.RedPlayerConnectionId = Context.ConnectionId;
        }
        else
        {
            room.BlackPlayerConnectionId = Context.ConnectionId;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId);
        await Clients.Caller.SendAsync("RoomCreated", new
        {
            room.RoomId,
            room.RoomName,
            Role = request.PlayAsRed ? "Red" : "Black",
            room.GameState,
            room.IsAiGame,
            room.AiDifficulty,
            RedPlayerName = room.RedPlayerName,
            BlackPlayerName = room.BlackPlayerName
        });

        // Broadcast updated room list to all lobby clients
        await Clients.All.SendAsync("RoomsUpdated", roomManager.GetActiveRooms());
    }

    public async Task JoinRoom(JoinRoomRequest request)
    {
        var success = roomManager.TryJoinRoom(
            request.RoomId,
            request.PlayerName,
            request.Username,
            Context.ConnectionId,
            out var room,
            out var assignedColor
        );

        if (!success || room == null)
        {
            await Clients.Caller.SendAsync("Error", "Không tìm thấy phòng hoặc phòng đã đầy!");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomId);

        string role = assignedColor switch
        {
            PieceColor.Red => "Red",
            PieceColor.Black => "Black",
            _ => "Observer"
        };

        await Clients.Caller.SendAsync("JoinedRoom", new
        {
            room.RoomId,
            room.RoomName,
            Role = role,
            RedPlayerName = room.RedPlayerName,
            BlackPlayerName = room.BlackPlayerName,
            room.GameState,
            room.IsAiGame,
            room.AiDifficulty
        });

        await Clients.Group(room.RoomId).SendAsync("PlayerJoined", new
        {
            PlayerName = request.PlayerName,
            Role = role,
            RedPlayerName = room.RedPlayerName,
            BlackPlayerName = room.BlackPlayerName
        });

        // Broadcast updated room list to lobby
        await Clients.All.SendAsync("RoomsUpdated", roomManager.GetActiveRooms());
    }

    public async Task MakeMove(MakeMoveRequest request)
    {
        if (string.IsNullOrEmpty(request.RoomId))
        {
            await Clients.Caller.SendAsync("Error", "Thiếu mã phòng!");
            return;
        }

        var room = roomManager.GetRoom(request.RoomId);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Không tìm thấy phòng!");
            return;
        }

        lock (room)
        {
            // Verify caller identity if players are registered
            if (!room.IsAiGame)
            {
                var isRedPlayer = room.RedPlayerConnectionId == Context.ConnectionId;
                var isBlackPlayer = room.BlackPlayerConnectionId == Context.ConnectionId;

                if (room.GameState.CurrentTurn == PieceColor.Red && !isRedPlayer && !string.IsNullOrEmpty(room.RedPlayerConnectionId))
                {
                    Clients.Caller.SendAsync("Error", "Chưa tới lượt của bạn!");
                    return;
                }
                if (room.GameState.CurrentTurn == PieceColor.Black && !isBlackPlayer && !string.IsNullOrEmpty(room.BlackPlayerConnectionId))
                {
                    Clients.Caller.SendAsync("Error", "Chưa tới lượt của bạn!");
                    return;
                }
            }

            var moved = rulesService.TryMakeMove(room.GameState, request.From, request.To, out var executedMove);
            if (!moved || executedMove == null)
            {
                Clients.Caller.SendAsync("Error", "Nước đi không hợp lệ!");
                return;
            }

            room.LastActivityAt = DateTime.UtcNow;

            // Broadcast move to all players in the room
            Clients.Group(room.RoomId).SendAsync("MoveMade", new
            {
                Move = executedMove,
                GameState = room.GameState
            });

            // If game is over, update Elo & records
            if (room.GameState.Status is GameStatus.Checkmate or GameStatus.Stalemate)
            {
                var winnerUser = room.GameState.Winner == PieceColor.Red ? room.RedUsername : room.BlackUsername;
                var loserUser = room.GameState.Winner == PieceColor.Red ? room.BlackUsername : room.RedUsername;
                _ = authService.UpdateMatchResultAsync(winnerUser, loserUser, false);
            }

            // If it's an AI game and it's AI turn, trigger AI move
            if (room.IsAiGame && (room.GameState.Status == GameStatus.Ongoing || room.GameState.Status == GameStatus.Check))
            {
                Task.Run(async () =>
                {
                    await Task.Delay(300);
                    var aiMove = aiService.FindBestMove(room.GameState, room.AiDifficulty);
                    if (aiMove != null)
                    {
                        lock (room)
                        {
                            if (rulesService.TryMakeMove(room.GameState, aiMove.From, aiMove.To, out var executedAiMove))
                            {
                                Clients.Group(room.RoomId).SendAsync("MoveMade", new
                                {
                                    Move = executedAiMove,
                                    GameState = room.GameState
                                });
                            }
                        }
                    }
                });
            }
        }
    }

    public async Task SendChat(string roomId, string sender, string message)
    {
        if (string.IsNullOrWhiteSpace(message)) return;
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        var chatMsg = new ChatMessageDto(sender, message.Trim(), DateTime.UtcNow);
        await Clients.Group(room.RoomId).SendAsync("ChatMessageReceived", chatMsg);
    }

    public async Task Resign(string roomId, string color)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        object endEvent;
        lock (room)
        {
            var resigningColor = color.Equals("Red", StringComparison.OrdinalIgnoreCase) ? PieceColor.Red : PieceColor.Black;
            room.GameState.Status = GameStatus.Resigned;
            room.GameState.Winner = resigningColor == PieceColor.Red ? PieceColor.Black : PieceColor.Red;

            var winnerUser = room.GameState.Winner == PieceColor.Red ? room.RedUsername : room.BlackUsername;
            var loserUser = room.GameState.Winner == PieceColor.Red ? room.BlackUsername : room.RedUsername;
            _ = authService.UpdateMatchResultAsync(winnerUser, loserUser, false);

            endEvent = new
            {
                Status = "Resigned",
                Winner = room.GameState.Winner.ToString(),
                Reason = $"Bên {(resigningColor == PieceColor.Red ? "Đỏ" : "Đen")} đã nhận thua!"
            };
        }

        await Clients.Group(room.RoomId).SendAsync("GameEnded", endEvent);
    }

    public async Task ReportTimeout(string roomId, string timedOutColor)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        object endEvent;
        lock (room)
        {
            var loserColor = timedOutColor.Equals("Red", StringComparison.OrdinalIgnoreCase) ? PieceColor.Red : PieceColor.Black;
            var winnerColor = loserColor == PieceColor.Red ? PieceColor.Black : PieceColor.Red;

            room.GameState.Status = GameStatus.Timeout;
            room.GameState.Winner = winnerColor;

            var winnerUser = winnerColor == PieceColor.Red ? room.RedUsername : room.BlackUsername;
            var loserUser = loserColor == PieceColor.Red ? room.BlackUsername : room.RedUsername;
            _ = authService.UpdateMatchResultAsync(winnerUser, loserUser, false);

            endEvent = new
            {
                Status = "Timeout",
                Winner = winnerColor.ToString(),
                Reason = $"Hết giờ thi đấu! Bên {(loserColor == PieceColor.Red ? "Đỏ" : "Đen")} đã cạn kiệt thời gian và bị xử thua theo luật quốc tế!"
            };
        }

        await Clients.Group(room.RoomId).SendAsync("GameEnded", endEvent);
    }

    public async Task OfferDraw(string roomId, string color)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        var offeringColor = color.Equals("Red", StringComparison.OrdinalIgnoreCase) ? PieceColor.Red : PieceColor.Black;
        var offeringName = offeringColor == PieceColor.Red ? room.RedPlayerName : room.BlackPlayerName;

        await Clients.OthersInGroup(room.RoomId).SendAsync("DrawOffered", new
        {
            RoomId = roomId,
            OfferingColor = offeringColor.ToString(),
            OfferingPlayerName = offeringName ?? "Đối thủ"
        });
    }

    public async Task RespondDraw(string roomId, bool accept)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        if (!accept)
        {
            await Clients.Group(room.RoomId).SendAsync("ChatMessageReceived", new ChatMessageDto(
                "Hệ Thống",
                "Đối thủ đã từ chối lời xin hòa cờ!",
                DateTime.UtcNow
            ));
            return;
        }

        object endEvent;
        lock (room)
        {
            room.GameState.Status = GameStatus.Draw;
            endEvent = new
            {
                Status = "Draw",
                Winner = (string?)null,
                Reason = "Hai bên đã đồng ý bắt tay giảng hòa!"
            };
        }

        await Clients.Group(room.RoomId).SendAsync("GameEnded", endEvent);
    }

    public async Task RequestRematch(string roomId)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return;

        GameState state;
        lock (room)
        {
            roomManager.ResetGame(room);
            state = room.GameState;
        }

        await Clients.Group(room.RoomId).SendAsync("RematchStarted", new
        {
            GameState = state
        });
    }
}
