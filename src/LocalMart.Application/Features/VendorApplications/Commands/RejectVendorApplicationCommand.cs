using FluentValidation;
using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorApplications.Commands;

public record RejectVendorApplicationCommand(
    Guid ApplicationId,
    Guid AdminUserId,
    string RejectionReason
) : IRequest<RejectVendorApplicationResponseDto>;

public class RejectVendorApplicationCommandValidator : AbstractValidator<RejectVendorApplicationCommand>
{
    public RejectVendorApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Application ID is required.");
        RuleFor(x => x.AdminUserId).NotEmpty().WithMessage("Admin User ID is required.");
        RuleFor(x => x.RejectionReason).NotEmpty().MaximumLength(1000).WithMessage("Rejection reason is required.");
    }
}

public class RejectVendorApplicationCommandHandler : IRequestHandler<RejectVendorApplicationCommand, RejectVendorApplicationResponseDto>
{
    private readonly IApplicationDbContext _context;

    public RejectVendorApplicationCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RejectVendorApplicationResponseDto> Handle(RejectVendorApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await _context.VendorApplications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
        {
            throw new KeyNotFoundException($"Vendor application with ID '{request.ApplicationId}' was not found.");
        }

        if (application.Status == "Approved")
        {
            throw new InvalidOperationException($"Cannot reject an already approved vendor application.");
        }

        if (application.Status == "Rejected")
        {
            throw new InvalidOperationException($"Vendor application '{request.ApplicationId}' is already rejected.");
        }

        application.Status = "Rejected";
        application.RejectionReason = request.RejectionReason.Trim();
        application.ReviewedByAdminId = request.AdminUserId;
        application.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new RejectVendorApplicationResponseDto(
            application.Id,
            application.Status,
            application.RejectionReason,
            $"Vendor application for '{application.BusinessName}' has been rejected."
        );
    }
}
