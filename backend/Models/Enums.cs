namespace XiangqiBackend.Models;

public enum PieceColor
{
    Red,
    Black
}

public enum PieceType
{
    King,     // Tướng / Soái
    Advisor,  // Sĩ
    Elephant, // Tượng / Tịnh
    Horse,    // Mã
    Rook,     // Xe
    Cannon,   // Pháo
    Pawn      // Tốt / Binh
}

public enum GameStatus
{
    NotStarted,
    Ongoing,
    Check,
    Checkmate,
    Stalemate,
    Resigned,
    Draw,
    Timeout
}
