namespace LocalMart.Application.Common.Models;

public class SmtpSettings
{
    public const string SectionName = "SmtpSettings";

    public bool EnableEmailDelivery { get; set; } = false;
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string SenderEmail { get; set; } = "noreply@localmart.com";
    public string SenderName { get; set; } = "LocalMart E-Commerce";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}
