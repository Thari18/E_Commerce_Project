using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace LiveAuthTester;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        client.BaseAddress = new Uri("http://localhost:5000");

        Console.WriteLine("=========================================");
        Console.WriteLine("TESTING LIVE AUTHENTICATION ENDPOINTS");
        Console.WriteLine("=========================================");

        // 1. LOGIN
        var loginPayload = JsonSerializer.Serialize(new { email = "admin@localmart.com", password = "AdminPass123!" });
        var loginContent = new StringContent(loginPayload, Encoding.UTF8, "application/json");
        var loginResponse = await client.PostAsync("/api/v1/auth/login", loginContent);
        var loginJson = await loginResponse.Content.ReadAsStringAsync();
        Console.WriteLine($"[1] LOGIN Status: {loginResponse.StatusCode}");
        
        using var doc = JsonDocument.Parse(loginJson);
        var accessToken = doc.RootElement.GetProperty("accessToken").GetString()!;
        var refreshToken = doc.RootElement.GetProperty("refreshToken").GetString()!;
        Console.WriteLine($"    -> Access Token: {accessToken.Substring(0, 25)}...");
        Console.WriteLine($"    -> Refresh Token: {refreshToken.Substring(0, 25)}...");

        // 2. REFRESH TOKEN ROTATION
        var refreshPayload = JsonSerializer.Serialize(new { refreshToken = refreshToken });
        var refreshContent = new StringContent(refreshPayload, Encoding.UTF8, "application/json");
        var refreshResponse = await client.PostAsync("/api/v1/auth/refresh", refreshContent);
        var refreshJson = await refreshResponse.Content.ReadAsStringAsync();
        Console.WriteLine($"\n[2] REFRESH Status: {refreshResponse.StatusCode}");
        
        using var refreshDoc = JsonDocument.Parse(refreshJson);
        var newAccessToken = refreshDoc.RootElement.GetProperty("accessToken").GetString()!;
        var newRefreshToken = refreshDoc.RootElement.GetProperty("refreshToken").GetString()!;
        Console.WriteLine($"    -> New Access Token: {newAccessToken.Substring(0, 25)}...");
        Console.WriteLine($"    -> New Refresh Token: {newRefreshToken.Substring(0, 25)}...");

        // 3. LOGOUT
        var logoutPayload = JsonSerializer.Serialize(new { refreshToken = newRefreshToken });
        var logoutContent = new StringContent(logoutPayload, Encoding.UTF8, "application/json");
        var logoutResponse = await client.PostAsync("/api/v1/auth/logout", logoutContent);
        var logoutJson = await logoutResponse.Content.ReadAsStringAsync();
        Console.WriteLine($"\n[3] LOGOUT Status: {logoutResponse.StatusCode}");
        Console.WriteLine($"    -> Response: {logoutJson}");

        // 4. REFRESH WITH REVOKED TOKEN (Should fail with 401 Unauthorized)
        var revokedPayload = JsonSerializer.Serialize(new { refreshToken = newRefreshToken });
        var revokedContent = new StringContent(revokedPayload, Encoding.UTF8, "application/json");
        var revokedResponse = await client.PostAsync("/api/v1/auth/refresh", revokedContent);
        Console.WriteLine($"\n[4] REFRESH REVOKED TOKEN Status: {revokedResponse.StatusCode} (Expected: 401 Unauthorized)");

        Console.WriteLine("\nLIVE AUTHENTICATION TEST COMPLETE!");
    }
}
