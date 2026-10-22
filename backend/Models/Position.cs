namespace XiangqiBackend.Models;

public readonly record struct Position(int Row, int Col)
{
    public bool IsValid() => Row is >= 0 and <= 9 && Col is >= 0 and <= 8;

    public bool IsInPalace(PieceColor color)
    {
        if (Col is < 3 or > 5) return false;
        return color == PieceColor.Red
            ? Row is >= 7 and <= 9
            : Row is >= 0 and <= 2;
    }

    public bool HasCrossedRiver(PieceColor color)
    {
        return color == PieceColor.Red ? Row <= 4 : Row >= 5;
    }

    public override string ToString() => $"({Row},{Col})";
}
