using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.Common.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LocalMart.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly SmtpSettings _smtpSettings;
    private readonly LoggingEmailService _fallbackLoggingService;

    public SmtpEmailService(
        ILogger<SmtpEmailService> logger,
        IOptions<SmtpSettings> smtpOptions,
        ILogger<LoggingEmailService> fallbackLogger)
    {
        _logger = logger;
        _smtpSettings = smtpOptions.Value;
        _fallbackLoggingService = new LoggingEmailService(fallbackLogger);
    }

    public async Task SendVendorApprovalPasswordSetupEmailAsync(
        string recipientEmail, 
        string recipientName, 
        string setupUrl, 
        CancellationToken cancellationToken = default)
    {
        var subject = "Your LocalMart Vendor Application Has Been Approved — Set Your Password";

        if (!_smtpSettings.EnableEmailDelivery || string.IsNullOrWhiteSpace(_smtpSettings.Host))
        {
            _logger.LogInformation("SMTP Email delivery is disabled or host not configured. Falling back to LoggingEmailService for recipient: {Email}", recipientEmail);
            await _fallbackLoggingService.SendVendorApprovalPasswordSetupEmailAsync(recipientEmail, recipientName, setupUrl, cancellationToken);
            return;
        }

        var htmlBody = $@"
        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;"">
            <h2 style=""color: #2563eb;"">Congratulations, {WebUtility.HtmlEncode(recipientName)}!</h2>
            <p>Your LocalMart vendor application has been approved by our administration team.</p>
            <p>To complete your vendor setup, please set your password using the link below (valid for 24 hours):</p>
            <div style=""margin: 24px 0; text-align: center;"">
                <a href=""{WebUtility.HtmlEncode(setupUrl)}"" style=""background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;"">
                    Set Your Vendor Password
                </a>
            </div>
            <p style=""color: #64748b; font-size: 13px;"">If you did not request this, please ignore this email.</p>
            <hr style=""border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;"" />
            <p style=""color: #94a3b8; font-size: 12px; text-align: center;"">&copy; LocalMart E-Commerce Platform</p>
        </div>";

        await SendEmailAsync(recipientEmail, subject, htmlBody, cancellationToken);
    }

    public async Task SendVendorApprovalNotificationEmailAsync(
        string recipientEmail, 
        string recipientName, 
        CancellationToken cancellationToken = default)
    {
        var subject = "Your LocalMart Vendor Application Has Been Approved";

        if (!_smtpSettings.EnableEmailDelivery || string.IsNullOrWhiteSpace(_smtpSettings.Host))
        {
            _logger.LogInformation("SMTP Email delivery is disabled or host not configured. Falling back to LoggingEmailService for recipient: {Email}", recipientEmail);
            await _fallbackLoggingService.SendVendorApprovalNotificationEmailAsync(recipientEmail, recipientName, cancellationToken);
            return;
        }

        var htmlBody = $@"
        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px;"">
            <h2 style=""color: #10b981;"">Welcome to LocalMart, {WebUtility.HtmlEncode(recipientName)}!</h2>
            <p>Your vendor application has been approved.</p>
            <p>You can now log in to the LocalMart Vendor Portal using your existing account credentials.</p>
            <hr style=""border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;"" />
            <p style=""color: #94a3b8; font-size: 12px; text-align: center;"">&copy; LocalMart E-Commerce Platform</p>
        </div>";

        await SendEmailAsync(recipientEmail, subject, htmlBody, cancellationToken);
    }

    private async Task SendEmailAsync(string recipientEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(recipientEmail);

            using var smtpClient = new SmtpClient(_smtpSettings.Host, _smtpSettings.Port)
            {
                EnableSsl = _smtpSettings.EnableSsl,
                Credentials = new NetworkCredential(_smtpSettings.Username, _smtpSettings.Password)
            };

            await smtpClient.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Successfully sent SMTP email to {RecipientEmail} with subject: {Subject}", recipientEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMTP email to {RecipientEmail}. Error: {Message}", recipientEmail, ex.Message);
            throw;
        }
    }
}
