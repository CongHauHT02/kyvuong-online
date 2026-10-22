using Microsoft.AspNetCore.Mvc;
using XiangqiBackend.DTOs;
using XiangqiBackend.Models;
using XiangqiBackend.Services;

namespace XiangqiBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController(
    XiangqiRulesService rulesService,
    XiangqiAiService aiService,
    RoomManagerService roomManager) : ControllerBase
{
    [HttpGet("new")]
    public ActionResult<GameState> GetNewGame()
    {
        return Ok(rulesService.CreateInitialGameState());
    }

    [HttpPost("legal-moves")]
    public ActionResult<List<Position>> GetLegalMoves([FromBody] LegalMovesRequest req)
    {
        var moves = rulesService.GetLegalMoves(req.GameState, req.Position);
        return Ok(moves);
    }

    [HttpPost("move")]
    public ActionResult<MoveResultResponse> MakeMove([FromBody] MoveExecutionRequest req)
    {
        var success = rulesService.TryMakeMove(req.GameState, req.From, req.To, out var move);
        if (!success || move == null)
        {
            return BadRequest(new { Message = "Nước đi không hợp lệ!" });
        }

        return Ok(new MoveResultResponse(req.GameState, move));
    }

    [HttpPost("ai-move")]
    public ActionResult<AiMoveResponse> CalculateAiMove([FromBody] AiMoveRequest req)
    {
        var bestMove = aiService.FindBestMove(req.GameState, req.Difficulty);
        if (bestMove == null)
        {
            return Ok(new AiMoveResponse(null, req.GameState, false));
        }

        var success = rulesService.TryMakeMove(req.GameState, bestMove.From, bestMove.To, out var executedMove);
        return Ok(new AiMoveResponse(executedMove, req.GameState, success));
    }

    [HttpGet("rooms")]
    public ActionResult<List<RoomSummaryDto>> GetRooms()
    {
        return Ok(roomManager.GetActiveRooms());
    }

    [HttpPost("rooms")]
    public ActionResult<GameRoom> CreateRoom([FromBody] CreateRoomRequest req)
    {
        var room = roomManager.CreateRoom(req.PlayerName, req.Username, req.RoomName, req.PlayAsRed, req.IsAiGame, req.AiDifficulty);
        return Ok(room);
    }

    [HttpGet("rooms/{roomId}")]
    public ActionResult<GameRoom> GetRoom(string roomId)
    {
        var room = roomManager.GetRoom(roomId);
        if (room == null) return NotFound(new { Message = "Không tìm thấy phòng!" });
        return Ok(room);
    }
}

public class LegalMovesRequest
{
    public GameState GameState { get; set; } = new();
    public Position Position { get; set; }
}

public class MoveExecutionRequest
{
    public GameState GameState { get; set; } = new();
    public Position From { get; set; }
    public Position To { get; set; }
}

public record MoveResultResponse(GameState GameState, Move Move);
public record AiMoveResponse(Move? Move, GameState GameState, bool Success);
