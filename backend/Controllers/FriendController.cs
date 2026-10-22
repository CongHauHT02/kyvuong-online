using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using XiangqiBackend.DTOs;
using XiangqiBackend.Hubs;
using XiangqiBackend.Services;

namespace XiangqiBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendController(
    FriendService friendService,
    UserPresenceService presenceService,
    IHubContext<GameHub> hubContext) : ControllerBase
{
    private int? CurrentUserId
    {
        get
        {
            var str = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(str, out var id) ? id : null;
        }
    }

    private string? CurrentUsername => User.FindFirstValue(ClaimTypes.Name);

    [HttpGet("list")]
    public async Task<IActionResult> GetFriends()
    {
        if (CurrentUserId == null) return Unauthorized();
        var friends = await friendService.GetFriendsListAsync(CurrentUserId.Value);
        return Ok(friends);
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        if (CurrentUserId == null) return Unauthorized();
        var requests = await friendService.GetPendingIncomingRequestsAsync(CurrentUserId.Value);
        return Ok(requests);
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto dto)
    {
        if (CurrentUserId == null) return Unauthorized();
        var (success, message, friendship) = await friendService.SendFriendRequestAsync(CurrentUserId.Value, dto.TargetUsername);
        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        // Realtime notification to target user if they are online
        var targetConnections = presenceService.GetConnectionIdsForUser(dto.TargetUsername);
        if (targetConnections.Count > 0)
        {
            var displayName = User.FindFirstValue("DisplayName") ?? CurrentUsername ?? "Kỳ Thủ";
            foreach (var connId in targetConnections)
            {
                await hubContext.Clients.Client(connId).SendAsync("FriendRequestReceived", new
                {
                    FromUsername = CurrentUsername,
                    FromDisplayName = displayName,
                    Message = $"{displayName} đã gửi cho bạn một lời mời kết bạn!"
                });
            }
        }

        return Ok(new { Message = message });
    }

    [HttpPost("accept/{requestId}")]
    public async Task<IActionResult> AcceptRequest(int requestId)
    {
        if (CurrentUserId == null) return Unauthorized();
        var (success, message) = await friendService.AcceptFriendRequestAsync(CurrentUserId.Value, requestId);
        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        return Ok(new { Message = message });
    }

    [HttpPost("reject/{requestId}")]
    public async Task<IActionResult> RejectRequest(int requestId)
    {
        if (CurrentUserId == null) return Unauthorized();
        var (success, message) = await friendService.RejectFriendRequestAsync(CurrentUserId.Value, requestId);
        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        return Ok(new { Message = message });
    }

    [HttpDelete("{targetUserId}")]
    public async Task<IActionResult> RemoveFriend(int targetUserId)
    {
        if (CurrentUserId == null) return Unauthorized();
        var (success, message) = await friendService.RemoveFriendAsync(CurrentUserId.Value, targetUserId);
        if (!success)
        {
            return BadRequest(new { Message = message });
        }

        return Ok(new { Message = message });
    }
}
