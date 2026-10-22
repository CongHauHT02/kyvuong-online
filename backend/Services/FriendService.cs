using Microsoft.EntityFrameworkCore;
using XiangqiBackend.Data;
using XiangqiBackend.DTOs;
using XiangqiBackend.Models;

namespace XiangqiBackend.Services;

public class FriendService(AppDbContext db, UserPresenceService presenceService)
{
    public async Task<(bool Success, string Message, Friendship? Friendship)> SendFriendRequestAsync(int currentUserId, string targetUsername)
    {
        targetUsername = targetUsername.Trim().ToLowerInvariant();
        var targetUser = await db.Users.FirstOrDefaultAsync(u => u.Username == targetUsername);
        if (targetUser == null)
        {
            return (false, "Không tìm thấy người chơi với tên đăng nhập này!", null);
        }

        if (targetUser.Id == currentUserId)
        {
            return (false, "Bạn không thể tự kết bạn với chính mình!", null);
        }

        // Check if relationship already exists
        var existing = await db.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == currentUserId && f.AddresseeId == targetUser.Id) ||
                (f.RequesterId == targetUser.Id && f.AddresseeId == currentUserId));

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return (false, "Hai bạn đã là bạn bè của nhau rồi!", existing);
            }
            if (existing.Status == FriendshipStatus.Pending)
            {
                if (existing.RequesterId == currentUserId)
                {
                    return (false, "Bạn đã gửi lời mời kết bạn trước đó, vui lòng chờ đối phương đồng ý!", existing);
                }
                else
                {
                    // The other person already sent request to current user, auto-accept it!
                    existing.Status = FriendshipStatus.Accepted;
                    existing.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                    return (true, "Hai bạn đã trở thành bạn bè!", existing);
                }
            }
            // If previously rejected, allow re-requesting
            existing.RequesterId = currentUserId;
            existing.AddresseeId = targetUser.Id;
            existing.Status = FriendshipStatus.Pending;
            existing.CreatedAt = DateTime.UtcNow;
            existing.UpdatedAt = null;
            await db.SaveChangesAsync();
            return (true, "Đã gửi lại lời mời kết bạn!", existing);
        }

        var friendship = new Friendship
        {
            RequesterId = currentUserId,
            AddresseeId = targetUser.Id,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.Friendships.Add(friendship);
        await db.SaveChangesAsync();

        return (true, $"Đã gửi lời mời kết bạn tới {targetUser.DisplayName}!", friendship);
    }

    public async Task<(bool Success, string Message)> AcceptFriendRequestAsync(int currentUserId, int requestId)
    {
        var friendship = await db.Friendships
            .Include(f => f.Requester)
            .FirstOrDefaultAsync(f => f.Id == requestId && f.AddresseeId == currentUserId);

        if (friendship == null)
        {
            return (false, "Không tìm thấy lời mời kết bạn này!");
        }

        if (friendship.Status == FriendshipStatus.Accepted)
        {
            return (false, "Lời mời kết bạn này đã được chấp nhận trước đó!");
        }

        friendship.Status = FriendshipStatus.Accepted;
        friendship.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return (true, $"Đã chấp nhận kết bạn với {friendship.Requester.DisplayName}!");
    }

    public async Task<(bool Success, string Message)> RejectFriendRequestAsync(int currentUserId, int requestId)
    {
        var friendship = await db.Friendships
            .FirstOrDefaultAsync(f => f.Id == requestId && f.AddresseeId == currentUserId);

        if (friendship == null)
        {
            return (false, "Không tìm thấy lời mời kết bạn này!");
        }

        db.Friendships.Remove(friendship);
        await db.SaveChangesAsync();

        return (true, "Đã từ chối lời mời kết bạn!");
    }

    public async Task<(bool Success, string Message)> RemoveFriendAsync(int currentUserId, int targetUserId)
    {
        var friendship = await db.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == currentUserId && f.AddresseeId == targetUserId) ||
                (f.RequesterId == targetUserId && f.AddresseeId == currentUserId));

        if (friendship == null)
        {
            return (false, "Không tìm thấy quan hệ bạn bè!");
        }

        db.Friendships.Remove(friendship);
        await db.SaveChangesAsync();

        return (true, "Đã hủy kết bạn thành công!");
    }

    public async Task<List<FriendDto>> GetFriendsListAsync(int currentUserId)
    {
        var friendships = await db.Friendships
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Where(f => (f.RequesterId == currentUserId || f.AddresseeId == currentUserId) && f.Status == FriendshipStatus.Accepted)
            .ToListAsync();

        var result = new List<FriendDto>();
        foreach (var f in friendships)
        {
            var otherUser = f.RequesterId == currentUserId ? f.Addressee : f.Requester;
            var isOnline = presenceService.IsUserOnline(otherUser.Username);

            result.Add(new FriendDto(
                f.Id,
                otherUser.Id,
                otherUser.Username,
                otherUser.DisplayName,
                otherUser.EloRating,
                otherUser.Wins,
                otherUser.Losses,
                otherUser.Draws,
                isOnline,
                "Friend",
                f.UpdatedAt ?? f.CreatedAt
            ));
        }

        // Order online friends first, then by Elo rating
        return result.OrderByDescending(f => f.IsOnline).ThenByDescending(f => f.EloRating).ToList();
    }

    public async Task<List<FriendRequestDto>> GetPendingIncomingRequestsAsync(int currentUserId)
    {
        var pending = await db.Friendships
            .Include(f => f.Requester)
            .Where(f => f.AddresseeId == currentUserId && f.Status == FriendshipStatus.Pending)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FriendRequestDto(
                f.Id,
                f.Requester.Id,
                f.Requester.Username,
                f.Requester.DisplayName,
                f.Requester.EloRating,
                f.CreatedAt
            ))
            .ToListAsync();

        return pending;
    }
}
