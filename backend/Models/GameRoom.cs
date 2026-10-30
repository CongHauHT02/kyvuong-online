namespace XiangqiBackend.Models;

public class GameRoom
{
    public required string RoomId { get; init; }
    public string RoomName { get; set; } = "Phòng Cờ Tướng";
    public string? RedPlayerConnectionId { get; set; }
    public string RedPlayerName { get; set; } = "Kỳ Thủ Đỏ";
    public string? RedUsername { get; set; }
    public string? BlackPlayerConnectionId { get; set; }
    public string BlackPlayerName { get; set; } = "Kỳ Thủ Đen";
    public string? BlackUsername { get; set; }
    public List<string> Observers { get; } = [];
    public GameState GameState { get; set; } = new();
    public bool IsAiGame { get; set; }
    public string AiDifficulty { get; set; } = "Medium";
    public bool IsHandicap { get; set; }
    public List<Position> HandicapRemovedPositions { get; set; } = [];
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
}
