namespace XiangqiBackend.Models;

public class Move
{
    public Position From { get; init; }
    public Position To { get; init; }
    public required Piece Piece { get; init; }
    public Piece? CapturedPiece { get; init; }
    public string Notation { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}
