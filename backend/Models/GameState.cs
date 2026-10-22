namespace XiangqiBackend.Models;

public class GameState
{
    public Piece?[][] Board { get; set; } = new Piece?[10][];
    public PieceColor CurrentTurn { get; set; } = PieceColor.Red;
    public GameStatus Status { get; set; } = GameStatus.Ongoing;
    public PieceColor? Winner { get; set; }
    public bool InCheck { get; set; }
    public Position? InCheckKingPos { get; set; }
    public List<Move> MoveHistory { get; set; } = [];
    public List<Piece> CapturedRedPieces { get; set; } = []; // Red pieces captured by Black
    public List<Piece> CapturedBlackPieces { get; set; } = []; // Black pieces captured by Red
    public int FullmoveNumber { get; set; } = 1;

    public GameState()
    {
        for (int r = 0; r < 10; r++)
        {
            Board[r] = new Piece?[9];
        }
    }

    public GameState Clone()
    {
        var clone = new GameState
        {
            CurrentTurn = CurrentTurn,
            Status = Status,
            Winner = Winner,
            InCheck = InCheck,
            InCheckKingPos = InCheckKingPos,
            FullmoveNumber = FullmoveNumber,
            MoveHistory = new List<Move>(MoveHistory),
            CapturedRedPieces = new List<Piece>(CapturedRedPieces),
            CapturedBlackPieces = new List<Piece>(CapturedBlackPieces)
        };

        for (int r = 0; r < 10; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                clone.Board[r][c] = Board[r][c];
            }
        }

        return clone;
    }
}
