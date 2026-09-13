using System.Threading;
using System.Threading.Tasks;

namespace LocalMart.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendVendorApprovalPasswordSetupEmailAsync(string recipientEmail, string recipientName, string setupUrl, CancellationToken cancellationToken = default);
    Task SendVendorApprovalNotificationEmailAsync(string recipientEmail, string recipientName, CancellationToken cancellationToken = default);
}
