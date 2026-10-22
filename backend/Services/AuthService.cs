using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using XiangqiBackend.Data;
using XiangqiBackend.Models;

namespace XiangqiBackend.Services;

public class AuthService(AppDbContext db, IConfiguration configuration)
{
    private readonly string _jwtSecret = configuration["Jwt:Secret"] ?? "KyVuongXiangqiSecretKeyMustBeAtLeast32BytesLong!";
    private readonly string _jwtIssuer = configuration["Jwt:Issuer"] ?? "KyVuongApp";

    public async Task<(bool Success, string Message, User? User, string? Token)> RegisterAsync(string username, string password, string displayName)
    {
        username = username.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
            return (false, "Tên đăng nhập phải có ít nhất 3 ký tự!", null, null);

        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            return (false, "Mật khẩu phải có ít nhất 6 ký tự!", null, null);

        if (string.IsNullOrWhiteSpace(displayName))
            displayName = username;

        var exists = await db.Users.AnyAsync(u => u.Username == username);
        if (exists)
            return (false, "Tên đăng nhập đã được sử dụng!", null, null);

        CreatePasswordHash(password, out string hash, out string salt);

        var user = new User
        {
            Username = username,
            PasswordHash = hash,
            PasswordSalt = salt,
            DisplayName = displayName.Trim(),
            EloRating = 1200,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return (true, "Đăng ký tài khoản thành công!", user, token);
    }

    public async Task<(bool Success, string Message, User? User, string? Token)> LoginAsync(string username, string password)
    {
        username = username.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null)
            return (false, "Tên đăng nhập hoặc mật khẩu không chính xác!", null, null);

        if (!VerifyPasswordHash(password, user.PasswordHash, user.PasswordSalt))
            return (false, "Tên đăng nhập hoặc mật khẩu không chính xác!", null, null);

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return (true, "Đăng nhập thành công!", user, token);
    }

    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await db.Users.FindAsync(id);
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await db.Users.FirstOrDefaultAsync(u => u.Username == username.Trim().ToLowerInvariant());
    }

    public async Task<List<UserDto>> GetLeaderboardAsync(int top = 20)
    {
        return await db.Users
            .OrderByDescending(u => u.EloRating)
            .Take(top)
            .Select(u => new UserDto(
                u.Id,
                u.Username,
                u.DisplayName,
                u.EloRating,
                u.Wins,
                u.Losses,
                u.Draws,
                u.Wins + u.Losses + u.Draws > 0 ? (double)u.Wins / (u.Wins + u.Losses + u.Draws) * 100 : 0
            ))
            .ToListAsync();
    }

    public async Task UpdateMatchResultAsync(string? winnerUsername, string? loserUsername, bool isDraw)
    {
        if (string.IsNullOrEmpty(winnerUsername) || string.IsNullOrEmpty(loserUsername)) return;

        var player1 = await GetUserByUsernameAsync(winnerUsername);
        var player2 = await GetUserByUsernameAsync(loserUsername);

        if (player1 == null || player2 == null) return;

        const int K = 32;
        double expected1 = 1.0 / (1.0 + Math.Pow(10, (player2.EloRating - player1.EloRating) / 400.0));
        double expected2 = 1.0 / (1.0 + Math.Pow(10, (player1.EloRating - player2.EloRating) / 400.0));

        if (isDraw)
        {
            player1.Draws++;
            player2.Draws++;
            player1.EloRating += (int)Math.Round(K * (0.5 - expected1));
            player2.EloRating += (int)Math.Round(K * (0.5 - expected2));
        }
        else
        {
            player1.Wins++;
            player2.Losses++;
            player1.EloRating += (int)Math.Round(K * (1.0 - expected1));
            player2.EloRating += (int)Math.Round(K * (0.0 - expected2));
        }

        // Keep Elo from falling below 100
        player1.EloRating = Math.Max(100, player1.EloRating);
        player2.EloRating = Math.Max(100, player2.EloRating);

        await db.SaveChangesAsync();
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSecret);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("DisplayName", user.DisplayName),
            new("EloRating", user.EloRating.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(30),
            Issuer = _jwtIssuer,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static void CreatePasswordHash(string password, out string hash, out string salt)
    {
        byte[] saltBytes = RandomNumberGenerator.GetBytes(16);
        salt = Convert.ToBase64String(saltBytes);

        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 10000, HashAlgorithmName.SHA256);
        byte[] hashBytes = pbkdf2.GetBytes(32);
        hash = Convert.ToBase64String(hashBytes);
    }

    private static bool VerifyPasswordHash(string password, string storedHash, string storedSalt)
    {
        byte[] saltBytes = Convert.FromBase64String(storedSalt);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 10000, HashAlgorithmName.SHA256);
        byte[] hashBytes = pbkdf2.GetBytes(32);
        string computedHash = Convert.ToBase64String(hashBytes);
        return computedHash == storedHash;
    }
}

public record UserDto(
    int Id,
    string Username,
    string DisplayName,
    int EloRating,
    int Wins,
    int Losses,
    int Draws,
    double WinRate
);
