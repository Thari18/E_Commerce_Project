using LocalMart.Application.Common.Interfaces;
using LocalMart.Application.DTOs;
using LocalMart.Domain.Entities;
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

        var applications = await query
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return applications.Select(MapToDetailDto).ToList();
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

        return MapToDetailDto(application);
    }

    private static VendorApplicationDetailDto MapToDetailDto(VendorApplication a)
    {
        var applicantName = a.ApplicantUser != null 
            ? $"{a.ApplicantUser.FirstName} {a.ApplicantUser.LastName}".Trim() 
            : a.OwnerFullName;

        return new VendorApplicationDetailDto(
            Id: a.Id,
            ApplicantUserId: a.ApplicantUserId,
            ApplicantName: string.IsNullOrWhiteSpace(applicantName) ? a.OwnerFullName : applicantName,

            // Owner & Identity (Private Verification Assets)
            OwnerFullName: a.OwnerFullName,
            OwnerEmail: a.OwnerEmail,
            OwnerPhone: a.OwnerPhone,
            OwnershipType: a.OwnershipType,
            ResidentialAddress: a.ResidentialAddress,
            IdType: a.IdType,
            IdNumber: a.IdNumber,
            OwnerPhotoRef: a.OwnerPhotoRef,
            IdDocumentRef: a.IdDocumentRef,

            // Business & Tax Details
            BusinessName: a.BusinessName,
            BusinessType: a.BusinessType,
            BusinessCategory: a.BusinessCategory,
            BusinessRegistrationNumber: a.BusinessRegistrationNumber,
            BusinessDescription: a.BusinessDescription,
            BusinessRegistrationDate: a.BusinessRegistrationDate,
            TaxIdentificationNumber: a.TaxIdentificationNumber,
            VatRegistrationNumber: a.VatRegistrationNumber,
            ContactPhone: a.ContactPhone,
            ContactEmail: a.ContactEmail,
            WebsiteUrl: a.WebsiteUrl,
            SocialMediaUrl: a.SocialMediaUrl,

            // Store Physical Location
            AddressLine1: a.AddressLine1,
            AddressLine2: a.AddressLine2,
            City: a.City,
            District: a.District,
            Province: a.Province,
            PostalCode: a.PostalCode,
            Latitude: a.Latitude,
            Longitude: a.Longitude,

            // Verification Documents (Private Verification Assets)
            BusinessRegistrationCertificateRef: a.BusinessRegistrationCertificateRef,
            TinCertificateRef: a.TinCertificateRef,
            TradeLicenceRef: a.TradeLicenceRef,
            OtherLicenceRef: a.OtherLicenceRef,

            // Store Profile Assets (Public Storefront)
            StoreFrontPhotoRef: a.StoreFrontPhotoRef,
            BusinessNameboardPhotoRef: a.BusinessNameboardPhotoRef,
            StoreInteriorPhotoRef: a.StoreInteriorPhotoRef,
            StoreLogoRef: a.StoreLogoRef,

            // Declarations & Audit
            TermsAccepted: a.TermsAccepted,
            MarketplacePolicyAccepted: a.MarketplacePolicyAccepted,
            InformationAccuracyConfirmed: a.InformationAccuracyConfirmed,
            TermsAcceptedAt: a.TermsAcceptedAt,

            // Moderation Status
            Status: a.Status,
            RejectionReason: a.RejectionReason,
            ReviewedByAdminId: a.ReviewedByAdminId,
            SubmittedAt: a.SubmittedAt,
            ReviewedAt: a.ReviewedAt
        );
    }
}
