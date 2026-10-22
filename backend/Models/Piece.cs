namespace XiangqiBackend.Models;

public class Piece
{
    public required string Id { get; init; }
    public PieceType Type { get; init; }
    public PieceColor Color { get; init; }
    public string Character => GetCharacter(Type, Color);
    public string VietnameseName => GetVietnameseName(Type, Color);
    public string Code => GetCode(Type, Color);

    public static string GetCharacter(PieceType type, PieceColor color) => (type, color) switch
    {
        (PieceType.King, PieceColor.Red) => "帥",
        (PieceType.King, PieceColor.Black) => "將",
        (PieceType.Advisor, PieceColor.Red) => "仕",
        (PieceType.Advisor, PieceColor.Black) => "士",
        (PieceType.Elephant, PieceColor.Red) => "相",
        (PieceType.Elephant, PieceColor.Black) => "象",
        (PieceType.Horse, PieceColor.Red) => "傌",
        (PieceType.Horse, PieceColor.Black) => "馬",
        (PieceType.Rook, PieceColor.Red) => "俥",
        (PieceType.Rook, PieceColor.Black) => "車",
        (PieceType.Cannon, PieceColor.Red) => "炮",
        (PieceType.Cannon, PieceColor.Black) => "砲",
        (PieceType.Pawn, PieceColor.Red) => "兵",
        (PieceType.Pawn, PieceColor.Black) => "卒",
        _ => "?"
    };

    public static string GetVietnameseName(PieceType type, PieceColor color) => type switch
    {
        PieceType.King => color == PieceColor.Red ? "Tướng (Soái)" : "Tướng",
        PieceType.Advisor => "Sĩ",
        PieceType.Elephant => color == PieceColor.Red ? "Tượng (Tướng)" : "Tượng (Voi)",
        PieceType.Horse => "Mã",
        PieceType.Rook => "Xe",
        PieceType.Cannon => "Pháo",
        PieceType.Pawn => color == PieceColor.Red ? "Binh" : "Tốt",
        _ => "Quân"
    };

    public static string GetCode(PieceType type, PieceColor color)
    {
        var ch = type switch
        {
            PieceType.King => 'k',
            PieceType.Advisor => 'a',
            PieceType.Elephant => 'b', // 'b' for bishop/elephant in Xiangqi FEN
            PieceType.Horse => 'n',    // 'n' for knight/horse
            PieceType.Rook => 'r',
            PieceType.Cannon => 'c',
            PieceType.Pawn => 'p',
            _ => '?'
        };
        return color == PieceColor.Red ? char.ToUpper(ch).ToString() : ch.ToString();
    }
}
