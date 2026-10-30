using XiangqiBackend.Models;

namespace XiangqiBackend.DTOs;

public class MakeMoveRequest
{
    public string? RoomId { get; set; }
    public Position From { get; set; }
    public Position To { get; set; }
}

public class CreateRoomRequest
{
    public string PlayerName { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? RoomName { get; set; }
    public bool PlayAsRed { get; set; } = true;
    public bool IsAiGame { get; set; }
    public string AiDifficulty { get; set; } = "Medium";
    public bool IsHandicap { get; set; }
    public List<Position>? RemovedPositions { get; set; }
}

public class JoinRoomRequest
{
    public string RoomId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public string? Username { get; set; }
}

public class AiMoveRequest
{
    public GameState GameState { get; set; } = new();
    public string Difficulty { get; set; } = "Medium";
}

public record ChatMessageDto(string Sender, string Message, DateTime Timestamp);

public record RoomSummaryDto(
    string RoomId,
    string RoomName,
    string RedPlayerName,
    string BlackPlayerName,
    bool HasRedPlayer,
    bool HasBlackPlayer,
    int ObserversCount,
    GameStatus Status,
    PieceColor CurrentTurn,
    bool IsHandicap = false
);
