using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using XiangqiBackend.Data;
using XiangqiBackend.Hubs;
using XiangqiBackend.Services;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory
});

// Database configuration (SQLite by default, ready for SQL Server if configured in appsettings.json)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=xiangqi.db";
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

// Authentication & JWT configuration
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "KyVuongXiangqiSecretKeyMustBeAtLeast32BytesLong!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "KyVuongApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Custom services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<FriendService>();
builder.Services.AddSingleton<UserPresenceService>();
builder.Services.AddSingleton<XiangqiRulesService>();
builder.Services.AddSingleton<XiangqiAiService>();
builder.Services.AddSingleton<RoomManagerService>();

// CORS configuration for local React dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-create database & tables on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""Friendships"" (
            ""Id"" INTEGER PRIMARY KEY AUTOINCREMENT,
            ""RequesterId"" INTEGER NOT NULL,
            ""AddresseeId"" INTEGER NOT NULL,
            ""Status"" INTEGER NOT NULL,
            ""CreatedAt"" TEXT NOT NULL,
            ""UpdatedAt"" TEXT NULL,
            FOREIGN KEY (""RequesterId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE,
            FOREIGN KEY (""AddresseeId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Friendships_RequesterId_AddresseeId"" ON ""Friendships"" (""RequesterId"", ""AddresseeId"");
    ");
}

app.UseCors("AllowFrontend");

// Serve static frontend files from wwwroot (for Somee.com single-package deployment)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GameHub>("/gameHub");

// SPA Fallback for client-side routing on Somee.com
app.MapFallbackToFile("index.html");

app.Run();
