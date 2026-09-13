using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Application.Features.VendorApplications.Queries;

public record GetAdminVendorApplicationsQuery(
    string? StatusFilter = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<List<VendorApplicationDetailDto>>;

public record GetAdminVendorApplicationByIdQuery(
    Guid ApplicationId
) : IRequest<VendorApplicationDetailDto>;

public class GetAdminVendorApplicationsQueryHandler : 
    IRequestHandler<GetAdminVendorApplicationsQuery, List<VendorApplicationDetailDto>>,
    IRequestHandler<GetAdminVendorApplicationByIdQuery, VendorApplicationDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminVendorApplicationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VendorApplicationDetailDto>> Handle(GetAdminVendorApplicationsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.VendorApplications
            .Include(a => a.ApplicantUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.StatusFilter))
        {
            var filter = request.StatusFilter.Trim();
            query = query.Where(a => a.Status == filter);
        }

        return await query
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new VendorApplicationDetailDto(
                a.Id,
                a.ApplicantUserId,
                $"{a.ApplicantUser.FirstName} {a.ApplicantUser.LastName}",
                a.BusinessName,
                a.BusinessRegistrationNumber,
                a.TaxIdentificationNumber,
                a.ContactPhone,
                a.ContactEmail,
                a.Status,
                a.RejectionReason,
                a.ReviewedByAdminId,
                a.SubmittedAt,
                a.ReviewedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<VendorApplicationDetailDto> Handle(GetAdminVendorApplicationByIdQuery request, CancellationToken cancellationToken)
    {
        var application = await _context.VendorApplications
            .Include(a => a.ApplicantUser)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
        {
            throw new KeyNotFoundException($"Vendor application with ID '{request.ApplicationId}' was not found.");
        }

        return new VendorApplicationDetailDto(
            application.Id,
            application.ApplicantUserId,
            $"{application.ApplicantUser.FirstName} {application.ApplicantUser.LastName}",
            application.BusinessName,
            application.BusinessRegistrationNumber,
            application.TaxIdentificationNumber,
            application.ContactPhone,
            application.ContactEmail,
            application.Status,
            application.RejectionReason,
            application.ReviewedByAdminId,
            application.SubmittedAt,
            application.ReviewedAt
        );
    }
}
