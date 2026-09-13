namespace LocalMart.Infrastructure.Identity;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "LocalMartAPI";
    public string Audience { get; set; } = "LocalMartClients";
    public int ExpiryMinutes { get; set; } = 60;
}
