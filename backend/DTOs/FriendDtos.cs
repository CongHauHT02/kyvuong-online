namespace XiangqiBackend.DTOs;

public record FriendDto(
    int Id,
    int UserId,
    string Username,
    string DisplayName,
    int EloRating,
    int Wins,
    int Losses,
    int Draws,
    bool IsOnline,
    string Status, // "Friend", "PendingIncoming", "PendingOutgoing"
    DateTime? Since
);

public record FriendRequestDto(
    int RequestId,
    int FromUserId,
    string FromUsername,
    string FromDisplayName,
    int FromElo,
    DateTime CreatedAt
);

public record SendFriendRequestDto(string TargetUsername);

public record FriendChallengeDto(
    string InviterUsername,
    string InviterDisplayName,
    int InviterElo,
    string RoomId,
    string RoomName
);

public record ChallengeResponseDto(
    string InviterUsername,
    string RoomId,
    bool Accepted,
    string? Message
);
