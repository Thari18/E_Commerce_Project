using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorApplications.Queries;

public record GetVendorApplicationStatusQuery(
    Guid? ApplicationId = null,
    string? Email = null,
    Guid? CurrentUserId = null
) : IRequest<VendorApplicationStatusDto>;

public class GetVendorApplicationStatusQueryHandler : IRequestHandler<GetVendorApplicationStatusQuery, VendorApplicationStatusDto>
{
    private readonly IApplicationDbContext _context;

    public GetVendorApplicationStatusQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VendorApplicationStatusDto> Handle(GetVendorApplicationStatusQuery request, CancellationToken cancellationToken)
    {
        var query = _context.VendorApplications.AsQueryable();

        if (request.CurrentUserId.HasValue && request.CurrentUserId.Value != Guid.Empty)
        {
            // Authenticated applicant user session
            query = query.Where(a => a.ApplicantUserId == request.CurrentUserId.Value);
        }
        else if (request.ApplicationId.HasValue && request.ApplicationId.Value != Guid.Empty && !string.IsNullOrWhiteSpace(request.Email))
        {
            // Unauthenticated status query requiring BOTH applicationId AND matching applicant email
            var emailTerm = request.Email.Trim().ToLowerInvariant();
            query = query.Where(a => a.Id == request.ApplicationId.Value && a.ContactEmail.ToLower() == emailTerm);
        }
        else
        {
            throw new ArgumentException("To check application status, provide an active applicant user session OR both applicationId and matching email.");
        }

        var application = await query
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (application == null)
        {
            throw new KeyNotFoundException("Vendor application not found or unauthorized.");
        }

        // Privacy Boundary: Tax IDs, documents, or sensitive registration details are NEVER exposed.
        return new VendorApplicationStatusDto(
            application.Id,
            application.BusinessName,
            application.Status,
            application.RejectionReason,
            application.SubmittedAt
        );
    }
}
