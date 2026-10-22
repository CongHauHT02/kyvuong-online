using System.Collections.Concurrent;

namespace XiangqiBackend.Services;

public class UserPresenceService
{
    // Maps Username (lowercase) -> Set of active ConnectionIds
    private readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();
    // Maps ConnectionId -> Username (lowercase)
    private readonly ConcurrentDictionary<string, string> _connectionUserMap = new();

    public void UserConnected(string username, string connectionId)
    {
        var normalizedUser = username.Trim().ToLowerInvariant();
        _connectionUserMap[connectionId] = normalizedUser;

        _userConnections.AddOrUpdate(
            normalizedUser,
            _ => new HashSet<string> { connectionId },
            (_, connections) =>
            {
                lock (connections)
                {
                    connections.Add(connectionId);
                }
                return connections;
            });
    }

    public void UserDisconnected(string connectionId, out string? disconnectedUser)
    {
        disconnectedUser = null;
        if (_connectionUserMap.TryRemove(connectionId, out var username))
        {
            if (_userConnections.TryGetValue(username, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(connectionId);
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(username, out _);
                        disconnectedUser = username;
                    }
                }
            }
        }
    }

    public bool IsUserOnline(string username)
    {
        var normalizedUser = username.Trim().ToLowerInvariant();
        return _userConnections.TryGetValue(normalizedUser, out var connections) && connections.Count > 0;
    }

    public List<string> GetConnectionIdsForUser(string username)
    {
        var normalizedUser = username.Trim().ToLowerInvariant();
        if (_userConnections.TryGetValue(normalizedUser, out var connections))
        {
            lock (connections)
            {
                return connections.ToList();
            }
        }
        return [];
    }

    public List<string> GetOnlineUsers()
    {
        return _userConnections.Keys.ToList();
    }
}
