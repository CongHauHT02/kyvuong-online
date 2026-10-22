using XiangqiBackend.Models;

namespace XiangqiBackend.Services;

public class XiangqiRulesService
{
    public GameState CreateInitialGameState()
    {
        var state = new GameState();
        var board = state.Board;

        // Black Pieces (Row 0 - 3)
        board[0][0] = CreatePiece("b_r_1", PieceType.Rook, PieceColor.Black);
        board[0][1] = CreatePiece("b_n_1", PieceType.Horse, PieceColor.Black);
        board[0][2] = CreatePiece("b_b_1", PieceType.Elephant, PieceColor.Black);
        board[0][3] = CreatePiece("b_a_1", PieceType.Advisor, PieceColor.Black);
        board[0][4] = CreatePiece("b_k", PieceType.King, PieceColor.Black);
        board[0][5] = CreatePiece("b_a_2", PieceType.Advisor, PieceColor.Black);
        board[0][6] = CreatePiece("b_b_2", PieceType.Elephant, PieceColor.Black);
        board[0][7] = CreatePiece("b_n_2", PieceType.Horse, PieceColor.Black);
        board[0][8] = CreatePiece("b_r_2", PieceType.Rook, PieceColor.Black);

        board[2][1] = CreatePiece("b_c_1", PieceType.Cannon, PieceColor.Black);
        board[2][7] = CreatePiece("b_c_2", PieceType.Cannon, PieceColor.Black);

        board[3][0] = CreatePiece("b_p_1", PieceType.Pawn, PieceColor.Black);
        board[3][2] = CreatePiece("b_p_2", PieceType.Pawn, PieceColor.Black);
        board[3][4] = CreatePiece("b_p_3", PieceType.Pawn, PieceColor.Black);
        board[3][6] = CreatePiece("b_p_4", PieceType.Pawn, PieceColor.Black);
        board[3][8] = CreatePiece("b_p_5", PieceType.Pawn, PieceColor.Black);

        // Red Pieces (Row 6 - 9)
        board[9][0] = CreatePiece("r_r_1", PieceType.Rook, PieceColor.Red);
        board[9][1] = CreatePiece("r_n_1", PieceType.Horse, PieceColor.Red);
        board[9][2] = CreatePiece("r_b_1", PieceType.Elephant, PieceColor.Red);
        board[9][3] = CreatePiece("r_a_1", PieceType.Advisor, PieceColor.Red);
        board[9][4] = CreatePiece("r_k", PieceType.King, PieceColor.Red);
        board[9][5] = CreatePiece("r_a_2", PieceType.Advisor, PieceColor.Red);
        board[9][6] = CreatePiece("r_b_2", PieceType.Elephant, PieceColor.Red);
        board[9][7] = CreatePiece("r_n_2", PieceType.Horse, PieceColor.Red);
        board[9][8] = CreatePiece("r_r_2", PieceType.Rook, PieceColor.Red);

        board[7][1] = CreatePiece("r_c_1", PieceType.Cannon, PieceColor.Red);
        board[7][7] = CreatePiece("r_c_2", PieceType.Cannon, PieceColor.Red);

        board[6][0] = CreatePiece("r_p_1", PieceType.Pawn, PieceColor.Red);
        board[6][2] = CreatePiece("r_p_2", PieceType.Pawn, PieceColor.Red);
        board[6][4] = CreatePiece("r_p_3", PieceType.Pawn, PieceColor.Red);
        board[6][6] = CreatePiece("r_p_4", PieceType.Pawn, PieceColor.Red);
        board[6][8] = CreatePiece("r_p_5", PieceType.Pawn, PieceColor.Red);

        state.CurrentTurn = PieceColor.Red;
        state.Status = GameStatus.Ongoing;
        UpdateCheckStatus(state);

        return state;
    }

    private static Piece CreatePiece(string id, PieceType type, PieceColor color) => new()
    {
        Id = id,
        Type = type,
        Color = color
    };

    public List<Position> GetLegalMoves(GameState state, Position from)
    {
        if (!from.IsValid()) return [];
        var piece = state.Board[from.Row][from.Col];
        if (piece == null || piece.Color != state.CurrentTurn) return [];

        var pseudoMoves = GetPseudoLegalMoves(state.Board, from, piece);
        var legalMoves = new List<Position>();

        foreach (var to in pseudoMoves)
        {
            if (IsMoveLegal(state, from, to))
            {
                legalMoves.Add(to);
            }
        }

        return legalMoves;
    }

    public List<Move> GetAllLegalMoves(GameState state, PieceColor color)
    {
        var moves = new List<Move>();
        for (int r = 0; r < 10; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                var piece = state.Board[r][c];
                if (piece != null && piece.Color == color)
                {
                    var from = new Position(r, c);
                    var destinations = GetPseudoLegalMoves(state.Board, from, piece);
                    foreach (var to in destinations)
                    {
                        if (IsMoveLegal(state, from, to))
                        {
                            var captured = state.Board[to.Row][to.Col];
                            moves.Add(new Move
                            {
                                From = from,
                                To = to,
                                Piece = piece,
                                CapturedPiece = captured,
                                Notation = GenerateVietnameseNotation(state.Board, from, to, piece)
                            });
                        }
                    }
                }
            }
        }
        return moves;
    }

    public bool TryMakeMove(GameState state, Position from, Position to, out Move? executedMove)
    {
        executedMove = null;
        if (state.Status is GameStatus.Checkmate or GameStatus.Stalemate or GameStatus.Resigned or GameStatus.Draw)
            return false;

        if (!from.IsValid() || !to.IsValid()) return false;
        var piece = state.Board[from.Row][from.Col];
        if (piece == null || piece.Color != state.CurrentTurn) return false;

        var legalMoves = GetLegalMoves(state, from);
        if (!legalMoves.Contains(to)) return false;

        var captured = state.Board[to.Row][to.Col];
        var notation = GenerateVietnameseNotation(state.Board, from, to, piece);

        // Execute move
        state.Board[to.Row][to.Col] = piece;
        state.Board[from.Row][from.Col] = null;

        if (captured != null)
        {
            if (captured.Color == PieceColor.Red)
                state.CapturedRedPieces.Add(captured);
            else
                state.CapturedBlackPieces.Add(captured);
        }

        executedMove = new Move
        {
            From = from,
            To = to,
            Piece = piece,
            CapturedPiece = captured,
            Notation = notation
        };
        state.MoveHistory.Add(executedMove);

        // Switch turn
        state.CurrentTurn = state.CurrentTurn == PieceColor.Red ? PieceColor.Black : PieceColor.Red;
        if (state.CurrentTurn == PieceColor.Red)
        {
            state.FullmoveNumber++;
        }

        // Update Game Status
        UpdateCheckStatus(state);

        var opponentLegalMoves = GetAllLegalMoves(state, state.CurrentTurn);
        if (opponentLegalMoves.Count == 0)
        {
            if (state.InCheck)
            {
                state.Status = GameStatus.Checkmate;
                state.Winner = state.CurrentTurn == PieceColor.Red ? PieceColor.Black : PieceColor.Red;
            }
            else
            {
                // In Xiangqi, having no legal moves (stalemate) is a loss for the side without moves
                state.Status = GameStatus.Stalemate;
                state.Winner = state.CurrentTurn == PieceColor.Red ? PieceColor.Black : PieceColor.Red;
            }
        }
        else if (state.InCheck)
        {
            state.Status = GameStatus.Check;
        }
        else
        {
            state.Status = GameStatus.Ongoing;
        }

        return true;
    }

    public bool IsMoveLegal(GameState state, Position from, Position to)
    {
        var piece = state.Board[from.Row][from.Col];
        if (piece == null) return false;

        var targetPiece = state.Board[to.Row][to.Col];
        if (targetPiece != null && targetPiece.Color == piece.Color) return false;

        // Clone board for tentative move
        var tempBoard = CloneBoard(state.Board);
        tempBoard[to.Row][to.Col] = piece;
        tempBoard[from.Row][from.Col] = null;

        // Check 1: Flying General (Two kings facing each other on same column)
        if (AreKingsFacing(tempBoard)) return false;

        // Check 2: Own King must not be in check
        var kingPos = FindKing(tempBoard, piece.Color);
        if (kingPos == null) return false;

        return !IsPositionUnderAttack(tempBoard, kingPos.Value, piece.Color == PieceColor.Red ? PieceColor.Black : PieceColor.Red);
    }

    public void UpdateCheckStatus(GameState state)
    {
        var currentKing = FindKing(state.Board, state.CurrentTurn);
        if (currentKing == null)
        {
            state.InCheck = false;
            state.InCheckKingPos = null;
            return;
        }

        var opponentColor = state.CurrentTurn == PieceColor.Red ? PieceColor.Black : PieceColor.Red;
        state.InCheck = IsPositionUnderAttack(state.Board, currentKing.Value, opponentColor);
        state.InCheckKingPos = state.InCheck ? currentKing.Value : null;
    }

    public static Position? FindKing(Piece?[][] board, PieceColor color)
    {
        for (int r = 0; r < 10; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                var p = board[r][c];
                if (p != null && p.Type == PieceType.King && p.Color == color)
                {
                    return new Position(r, c);
                }
            }
        }
        return null;
    }

    public static bool AreKingsFacing(Piece?[][] board)
    {
        var redKing = FindKing(board, PieceColor.Red);
        var blackKing = FindKing(board, PieceColor.Black);

        if (redKing == null || blackKing == null) return false;
        if (redKing.Value.Col != blackKing.Value.Col) return false;

        int col = redKing.Value.Col;
        int minRow = Math.Min(redKing.Value.Row, blackKing.Value.Row);
        int maxRow = Math.Max(redKing.Value.Row, blackKing.Value.Row);

        for (int r = minRow + 1; r < maxRow; r++)
        {
            if (board[r][col] != null) return false;
        }

        return true;
    }

    public bool IsPositionUnderAttack(Piece?[][] board, Position target, PieceColor attackerColor)
    {
        for (int r = 0; r < 10; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                var piece = board[r][c];
                if (piece != null && piece.Color == attackerColor)
                {
                    var moves = GetPseudoLegalMoves(board, new Position(r, c), piece);
                    if (moves.Contains(target))
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public List<Position> GetPseudoLegalMoves(Piece?[][] board, Position from, Piece piece)
    {
        var moves = new List<Position>();
        switch (piece.Type)
        {
            case PieceType.King:
                GetKingMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Advisor:
                GetAdvisorMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Elephant:
                GetElephantMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Horse:
                GetHorseMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Rook:
                GetRookMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Cannon:
                GetCannonMoves(board, from, piece.Color, moves);
                break;
            case PieceType.Pawn:
                GetPawnMoves(board, from, piece.Color, moves);
                break;
        }
        return moves;
    }

    private static void GetKingMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int[] dr = [-1, 1, 0, 0];
        int[] dc = [0, 0, -1, 1];

        for (int i = 0; i < 4; i++)
        {
            var next = new Position(from.Row + dr[i], from.Col + dc[i]);
            if (next.IsValid() && next.IsInPalace(color))
            {
                var target = board[next.Row][next.Col];
                if (target == null || target.Color != color)
                {
                    moves.Add(next);
                }
            }
        }
    }

    private static void GetAdvisorMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int[] dr = [-1, -1, 1, 1];
        int[] dc = [-1, 1, -1, 1];

        for (int i = 0; i < 4; i++)
        {
            var next = new Position(from.Row + dr[i], from.Col + dc[i]);
            if (next.IsValid() && next.IsInPalace(color))
            {
                var target = board[next.Row][next.Col];
                if (target == null || target.Color != color)
                {
                    moves.Add(next);
                }
            }
        }
    }

    private static void GetElephantMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int[] dr = [-2, -2, 2, 2];
        int[] dc = [-2, 2, -2, 2];

        for (int i = 0; i < 4; i++)
        {
            var next = new Position(from.Row + dr[i], from.Col + dc[i]);
            if (!next.IsValid()) continue;

            // Elephant cannot cross river
            if (next.HasCrossedRiver(color)) continue;

            // Check Elephant Eye (midpoint)
            int eyeRow = from.Row + dr[i] / 2;
            int eyeCol = from.Col + dc[i] / 2;
            if (board[eyeRow][eyeCol] != null) continue; // Blocked!

            var target = board[next.Row][next.Col];
            if (target == null || target.Color != color)
            {
                moves.Add(next);
            }
        }
    }

    private static void GetHorseMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        // 8 possible moves for Horse
        // deltaRow, deltaCol, blockRowDelta, blockColDelta
        (int dr, int dc, int br, int bc)[] jumps =
        [
            (-2, -1, -1, 0),
            (-2,  1, -1, 0),
            ( 2, -1,  1, 0),
            ( 2,  1,  1, 0),
            (-1, -2,  0, -1),
            ( 1, -2,  0, -1),
            (-1,  2,  0,  1),
            ( 1,  2,  0,  1)
        ];

        foreach (var (dr, dc, br, bc) in jumps)
        {
            var next = new Position(from.Row + dr, from.Col + dc);
            if (!next.IsValid()) continue;

            // Horse leg block check
            int blockRow = from.Row + br;
            int blockCol = from.Col + bc;
            if (board[blockRow][blockCol] != null) continue; // Blocked leg!

            var target = board[next.Row][next.Col];
            if (target == null || target.Color != color)
            {
                moves.Add(next);
            }
        }
    }

    private static void GetRookMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int[] dr = [-1, 1, 0, 0];
        int[] dc = [0, 0, -1, 1];

        for (int i = 0; i < 4; i++)
        {
            int r = from.Row + dr[i];
            int c = from.Col + dc[i];

            while (r is >= 0 and <= 9 && c is >= 0 and <= 8)
            {
                var target = board[r][c];
                if (target == null)
                {
                    moves.Add(new Position(r, c));
                }
                else
                {
                    if (target.Color != color)
                    {
                        moves.Add(new Position(r, c));
                    }
                    break;
                }
                r += dr[i];
                c += dc[i];
            }
        }
    }

    private static void GetCannonMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int[] dr = [-1, 1, 0, 0];
        int[] dc = [0, 0, -1, 1];

        for (int i = 0; i < 4; i++)
        {
            int r = from.Row + dr[i];
            int c = from.Col + dc[i];
            bool passedScreen = false;

            while (r is >= 0 and <= 9 && c is >= 0 and <= 8)
            {
                var target = board[r][c];
                if (!passedScreen)
                {
                    if (target == null)
                    {
                        moves.Add(new Position(r, c));
                    }
                    else
                    {
                        passedScreen = true; // Encountered the screen piece
                    }
                }
                else
                {
                    if (target != null)
                    {
                        if (target.Color != color)
                        {
                            moves.Add(new Position(r, c)); // Capture!
                        }
                        break; // Cannon can only jump over one piece
                    }
                }
                r += dr[i];
                c += dc[i];
            }
        }
    }

    private static void GetPawnMoves(Piece?[][] board, Position from, PieceColor color, List<Position> moves)
    {
        int forwardDelta = color == PieceColor.Red ? -1 : 1;

        // Forward move
        var forward = new Position(from.Row + forwardDelta, from.Col);
        if (forward.IsValid())
        {
            var target = board[forward.Row][forward.Col];
            if (target == null || target.Color != color)
            {
                moves.Add(forward);
            }
        }

        // Sideways moves (only after crossing river)
        if (from.HasCrossedRiver(color))
        {
            int[] dc = [-1, 1];
            foreach (int cDelta in dc)
            {
                var side = new Position(from.Row, from.Col + cDelta);
                if (side.IsValid())
                {
                    var target = board[side.Row][side.Col];
                    if (target == null || target.Color != color)
                    {
                        moves.Add(side);
                    }
                }
            }
        }
    }

    public static string GenerateVietnameseNotation(Piece?[][] board, Position from, Position to, Piece piece)
    {
        // Piece abbreviation: X, M, T, S, Tg, P, B/C
        string pieceCode = piece.Type switch
        {
            PieceType.King => "Tg",
            PieceType.Advisor => "S",
            PieceType.Elephant => "T",
            PieceType.Horse => "M",
            PieceType.Rook => "X",
            PieceType.Cannon => "P",
            PieceType.Pawn => piece.Color == PieceColor.Red ? "B" : "C",
            _ => "?"
        };

        // Red counts columns 1-9 from right to left (col 8 is 1, col 0 is 9)
        // Black counts columns 1-9 from right to left (col 0 is 1, col 8 is 9)
        int fromCol = piece.Color == PieceColor.Red ? 9 - from.Col : from.Col + 1;
        int toCol = piece.Color == PieceColor.Red ? 9 - to.Col : to.Col + 1;

        string action;
        int delta;

        if (from.Row == to.Row)
        {
            // Horizontal move (Bình)
            action = "-";
            delta = toCol;
        }
        else
        {
            bool isAdvance = piece.Color == PieceColor.Red ? to.Row < from.Row : to.Row > from.Row;
            action = isAdvance ? "." : "/";

            if (piece.Type is PieceType.Horse or PieceType.Elephant or PieceType.Advisor)
            {
                delta = toCol;
            }
            else
            {
                // Orthogonal advance/retreat: number of squares
                delta = Math.Abs(to.Row - from.Row);
            }
        }

        return $"{pieceCode}{fromCol}{action}{delta}";
    }

    private static Piece?[][] CloneBoard(Piece?[][] source)
    {
        var clone = new Piece?[10][];
        for (int r = 0; r < 10; r++)
        {
            clone[r] = new Piece?[9];
            for (int c = 0; c < 9; c++)
            {
                clone[r][c] = source[r][c];
            }
        }
        return clone;
    }
}
