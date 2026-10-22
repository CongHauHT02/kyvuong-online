using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XiangqiBackend.Services;

namespace XiangqiBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var (success, message, user, token) = await authService.RegisterAsync(req.Username, req.Password, req.DisplayName);
        if (!success || user == null)
        {
            return BadRequest(new { Message = message });
        }

        return Ok(new
        {
            Message = message,
            Token = token,
            User = new
            {
                user.Id,
                user.Username,
                user.DisplayName,
                user.EloRating,
                user.Wins,
                user.Losses,
                user.Draws
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var (success, message, user, token) = await authService.LoginAsync(req.Username, req.Password);
        if (!success || user == null)
        {
            return BadRequest(new { Message = message });
        }

        return Ok(new
        {
            Message = message,
            Token = token,
            User = new
            {
                user.Id,
                user.Username,
                user.DisplayName,
                user.EloRating,
                user.Wins,
                user.Losses,
                user.Draws
            }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.DisplayName,
            user.EloRating,
            user.Wins,
            user.Losses,
            user.Draws
        });
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var leaders = await authService.GetLeaderboardAsync();
        return Ok(leaders);
    }
}

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
