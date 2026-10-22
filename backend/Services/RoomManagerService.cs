using System.Collections.Concurrent;
using XiangqiBackend.DTOs;
using XiangqiBackend.Models;

namespace XiangqiBackend.Services;

public class RoomManagerService(XiangqiRulesService rulesService)
{
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();

    public GameRoom CreateRoom(string playerName, string? username, string? roomName, bool playAsRed = true, bool isAiGame = false, string aiDifficulty = "Medium")
    {
        var roomId = GenerateRoomCode();
        var initialGame = rulesService.CreateInitialGameState();

        var room = new GameRoom
        {
            RoomId = roomId,
            RoomName = string.IsNullOrWhiteSpace(roomName) ? $"Phòng #{roomId}" : roomName.Trim(),
            GameState = initialGame,
            IsAiGame = isAiGame,
            AiDifficulty = aiDifficulty
        };

        if (playAsRed)
        {
            room.RedPlayerName = playerName;
            room.RedUsername = username;
            if (isAiGame) room.BlackPlayerName = $"Máy ({aiDifficulty})";
        }
        else
        {
            room.BlackPlayerName = playerName;
            room.BlackUsername = username;
            if (isAiGame) room.RedPlayerName = $"Máy ({aiDifficulty})";
        }

        _rooms[roomId] = room;
        return room;
    }

    public GameRoom? GetRoom(string roomId)
    {
        _rooms.TryGetValue(roomId.ToUpperInvariant(), out var room);
        return room;
    }

    public bool TryJoinRoom(string roomId, string playerName, string? username, string connectionId, out GameRoom? room, out PieceColor? assignedColor)
    {
        assignedColor = null;
        if (!_rooms.TryGetValue(roomId.ToUpperInvariant(), out room))
        {
            return false;
        }

        lock (room)
        {
            room.LastActivityAt = DateTime.UtcNow;

            // Check if player is already red or black
            if (room.RedPlayerConnectionId == connectionId)
            {
                assignedColor = PieceColor.Red;
                return true;
            }
            if (room.BlackPlayerConnectionId == connectionId)
            {
                assignedColor = PieceColor.Black;
                return true;
            }

            // Assign empty slot
            if (string.IsNullOrEmpty(room.RedPlayerConnectionId) && !room.IsAiGame)
            {
                room.RedPlayerConnectionId = connectionId;
                room.RedPlayerName = playerName;
                room.RedUsername = username;
                assignedColor = PieceColor.Red;
                return true;
            }

            if (string.IsNullOrEmpty(room.BlackPlayerConnectionId))
            {
                room.BlackPlayerConnectionId = connectionId;
                room.BlackPlayerName = playerName;
                room.BlackUsername = username;
                assignedColor = PieceColor.Black;
                return true;
            }

            // Otherwise join as observer
            if (!room.Observers.Contains(connectionId))
            {
                room.Observers.Add(connectionId);
            }
            return true;
        }
    }

    public List<RoomSummaryDto> GetActiveRooms()
    {
        return _rooms.Values
            .Where(r => DateTime.UtcNow - r.LastActivityAt < TimeSpan.FromHours(2))
            .OrderByDescending(r => r.LastActivityAt)
            .Take(20)
            .Select(r => new RoomSummaryDto(
                r.RoomId,
                r.RoomName,
                r.RedPlayerName,
                r.BlackPlayerName,
                !string.IsNullOrEmpty(r.RedPlayerConnectionId),
                !string.IsNullOrEmpty(r.BlackPlayerConnectionId),
                r.Observers.Count,
                r.GameState.Status,
                r.GameState.CurrentTurn
            ))
            .ToList();
    }

    public void ResetGame(GameRoom room)
    {
        lock (room)
        {
            room.GameState = rulesService.CreateInitialGameState();
            room.LastActivityAt = DateTime.UtcNow;
        }
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 6).Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
    }
}
