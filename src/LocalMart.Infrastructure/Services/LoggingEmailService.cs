using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LocalMart.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace LocalMart.Infrastructure.Services;

public record SentEmailNotification(
    string RecipientEmail,
    string RecipientName,
    string Subject,
    string BodySummary,
    DateTime SentAt
);

public class LoggingEmailService : IEmailService
{
    private readonly ILogger<LoggingEmailService> _logger;
    private static readonly ConcurrentBag<SentEmailNotification> _sentEmails = new();

    public LoggingEmailService(ILogger<LoggingEmailService> logger)
    {
        _logger = logger;
    }

    public static IReadOnlyCollection<SentEmailNotification> SentEmails => _sentEmails;

    public static void ClearSentEmails() => _sentEmails.Clear();

    public Task SendVendorApprovalPasswordSetupEmailAsync(string recipientEmail, string recipientName, string setupUrl, CancellationToken cancellationToken = default)
    {
        var subject = "Your LocalMart Vendor Application Has Been Approved — Set Your Password";
        var bodySummary = $"Congratulations {recipientName}! Your vendor application has been approved. Please set your password using the secure link provided (valid for 24 hours).";

        // Security rule: Do not output raw security tokens into persistent log files.
        _logger.LogInformation("Dispatched Vendor Password Setup Email to: {RecipientEmail}. Subject: {Subject}", recipientEmail, subject);

        _sentEmails.Add(new SentEmailNotification(recipientEmail, recipientName, subject, bodySummary, DateTime.UtcNow));

        return Task.CompletedTask;
    }

    public Task SendVendorApprovalNotificationEmailAsync(string recipientEmail, string recipientName, CancellationToken cancellationToken = default)
    {
        var subject = "Your LocalMart Vendor Application Has Been Approved";
        var bodySummary = $"Congratulations {recipientName}! Your vendor application has been approved. You may now log in to the Vendor Portal using your existing account credentials.";

        _logger.LogInformation("Dispatched Vendor Approval Notification Email to: {RecipientEmail}. Subject: {Subject}", recipientEmail, subject);

        _sentEmails.Add(new SentEmailNotification(recipientEmail, recipientName, subject, bodySummary, DateTime.UtcNow));

        return Task.CompletedTask;
    }
}
