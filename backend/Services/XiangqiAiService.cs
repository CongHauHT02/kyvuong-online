using XiangqiBackend.Models;

namespace XiangqiBackend.Services;

public class XiangqiAiService(XiangqiRulesService rulesService)
{
    private static readonly int[,] HorsePst =
    {
        { 0, -5, 10, 5, 0, 5, 10, -5, 0 },
        {-5, 10, 20, 25, 10, 25, 20, 10, -5 },
        { 0, 15, 30, 35, 40, 35, 30, 15, 0 },
        { 5, 20, 35, 45, 50, 45, 35, 20, 5 },
        { 5, 25, 40, 50, 55, 50, 40, 25, 5 },
        { 5, 25, 40, 50, 55, 50, 40, 25, 5 },
        { 5, 20, 35, 45, 50, 45, 35, 20, 5 },
        { 0, 15, 30, 35, 40, 35, 30, 15, 0 },
        {-5, 10, 20, 25, 10, 25, 20, 10, -5 },
        { 0, -5, 10, 5, 0, 5, 10, -5, 0 }
    };

    private static readonly int[,] CannonPst =
    {
        { 0, 0, 5, 10, 10, 10, 5, 0, 0 },
        { 0, 5, 10, 15, 20, 15, 10, 5, 0 },
        { 0, 10, 20, 30, 40, 30, 20, 10, 0 },
        { 5, 15, 25, 35, 40, 35, 25, 15, 5 },
        { 5, 15, 25, 30, 35, 30, 25, 15, 5 },
        { 5, 15, 25, 30, 35, 30, 25, 15, 5 },
        { 5, 15, 25, 35, 40, 35, 25, 15, 5 },
        { 0, 10, 20, 30, 40, 30, 20, 10, 0 },
        { 0, 5, 10, 15, 20, 15, 10, 5, 0 },
        { 0, 0, 5, 10, 10, 10, 5, 0, 0 }
    };

    private static readonly int[,] PawnPst =
    {
        { 100, 100, 120, 140, 150, 140, 120, 100, 100 },
        {  80,  90, 110, 130, 140, 130, 110,  90,  80 },
        {  60,  70,  90, 110, 120, 110,  90,  70,  60 },
        {  40,  50,  60,  80,  90,  80,  60,  50,  40 },
        {  20,  30,  40,  50,  60,  50,  40,  30,  20 },
        {   0,   0,   0,   0,   0,   0,   0,   0,   0 },
        {   0,   0,   0,   0,   0,   0,   0,   0,   0 },
        {   0,   0,   0,   0,   0,   0,   0,   0,   0 },
        {   0,   0,   0,   0,   0,   0,   0,   0,   0 },
        {   0,   0,   0,   0,   0,   0,   0,   0,   0 }
    };

    public Move? FindBestMove(GameState state, string difficulty = "Medium")
    {
        var legalMoves = rulesService.GetAllLegalMoves(state, state.CurrentTurn);
        if (legalMoves.Count == 0) return null;

        int depth = difficulty.ToLower() switch
        {
            "easy" => 2,
            "hard" => 4,
            _ => 3
        };

        // If Easy, add a slight probability of random selection for casual play
        if (difficulty.Equals("easy", StringComparison.OrdinalIgnoreCase) && Random.Shared.Next(100) < 30)
        {
            return legalMoves[Random.Shared.Next(legalMoves.Count)];
        }

        // Sort moves: Captures first (MVV-LVA)
        legalMoves = OrderMoves(legalMoves);

        Move? bestMove = null;
        int alpha = int.MinValue + 100;
        int beta = int.MaxValue - 100;
        bool isMaximizing = state.CurrentTurn == PieceColor.Red;

        int bestValue = isMaximizing ? int.MinValue : int.MaxValue;

        foreach (var move in legalMoves)
        {
            var nextState = state.Clone();
            rulesService.TryMakeMove(nextState, move.From, move.To, out _);

            int val = AlphaBeta(nextState, depth - 1, alpha, beta, !isMaximizing);

            if (isMaximizing)
            {
                if (val > bestValue)
                {
                    bestValue = val;
                    bestMove = move;
                }
                alpha = Math.Max(alpha, bestValue);
            }
            else
            {
                if (val < bestValue)
                {
                    bestValue = val;
                    bestMove = move;
                }
                beta = Math.Min(beta, bestValue);
            }

            if (beta <= alpha) break;
        }

        return bestMove ?? legalMoves[0];
    }

    private int AlphaBeta(GameState state, int depth, int alpha, int beta, bool isMaximizing)
    {
        if (depth == 0 || state.Status is GameStatus.Checkmate or GameStatus.Stalemate)
        {
            return EvaluateState(state);
        }

        var legalMoves = rulesService.GetAllLegalMoves(state, state.CurrentTurn);
        if (legalMoves.Count == 0)
        {
            return EvaluateState(state);
        }

        legalMoves = OrderMoves(legalMoves);

        if (isMaximizing)
        {
            int maxEval = int.MinValue;
            foreach (var move in legalMoves)
            {
                var nextState = state.Clone();
                rulesService.TryMakeMove(nextState, move.From, move.To, out _);

                int eval = AlphaBeta(nextState, depth - 1, alpha, beta, false);
                maxEval = Math.Max(maxEval, eval);
                alpha = Math.Max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        }
        else
        {
            int minEval = int.MaxValue;
            foreach (var move in legalMoves)
            {
                var nextState = state.Clone();
                rulesService.TryMakeMove(nextState, move.From, move.To, out _);

                int eval = AlphaBeta(nextState, depth - 1, alpha, beta, true);
                minEval = Math.Min(minEval, eval);
                beta = Math.Min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    private static List<Move> OrderMoves(List<Move> moves)
    {
        return moves.OrderByDescending(m =>
        {
            if (m.CapturedPiece != null)
            {
                return GetPieceValue(m.CapturedPiece.Type) * 10 - GetPieceValue(m.Piece.Type);
            }
            return 0;
        }).ToList();
    }

    public int EvaluateState(GameState state)
    {
        if (state.Status == GameStatus.Checkmate || state.Status == GameStatus.Stalemate)
        {
            return state.Winner == PieceColor.Red ? 50000 : -50000;
        }

        int score = 0;

        for (int r = 0; r < 10; r++)
        {
            for (int c = 0; c < 9; c++)
            {
                var piece = state.Board[r][c];
                if (piece == null) continue;

                int baseVal = GetPieceValue(piece.Type);
                int pstBonus = GetPstBonus(piece, r, c);
                int totalPieceVal = baseVal + pstBonus;

                if (piece.Color == PieceColor.Red)
                {
                    score += totalPieceVal;
                }
                else
                {
                    score -= totalPieceVal;
                }
            }
        }

        return score;
    }

    private static int GetPieceValue(PieceType type) => type switch
    {
        PieceType.King => 10000,
        PieceType.Rook => 900,
        PieceType.Cannon => 450,
        PieceType.Horse => 400,
        PieceType.Advisor => 200,
        PieceType.Elephant => 200,
        PieceType.Pawn => 100,
        _ => 0
    };

    private static int GetPstBonus(Piece piece, int r, int c)
    {
        // For Black pieces, row position is inverted for Pawn table
        int redRow = r;
        int blackRow = 9 - r;

        return piece.Type switch
        {
            PieceType.Horse => HorsePst[r, c],
            PieceType.Cannon => CannonPst[r, c],
            PieceType.Pawn => piece.Color == PieceColor.Red
                ? (r <= 4 ? 100 + PawnPst[blackRow, c] : 0)
                : (r >= 5 ? 100 + PawnPst[redRow, c] : 0),
            _ => 0
        };
    }
}
