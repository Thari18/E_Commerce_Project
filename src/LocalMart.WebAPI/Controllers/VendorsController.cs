using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.VendorApplications.Commands;
using LocalMart.Application.Features.VendorApplications.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/vendors")]
public class VendorsController : ApiController
{
    [HttpPost("applications")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VendorApplicationResponseDto), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitVendorApplicationRequestDto dto, CancellationToken ct)
    {
        Guid? userId = dto.ApplicantUserId;
        if ((!userId.HasValue || userId.Value == Guid.Empty) && User.Identity?.IsAuthenticated == true)
        {
            var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(nameIdentifier, out var parsedId))
            {
                userId = parsedId;
            }
        }

        var command = new SubmitVendorApplicationCommand(
            ApplicantUserId: userId,
            OwnerFullName: dto.OwnerFullName,
            OwnerEmail: dto.OwnerEmail,
            OwnerPhone: dto.OwnerPhone,
            OwnershipType: dto.OwnershipType,
            ResidentialAddress: dto.ResidentialAddress,
            IdType: dto.IdType,
            IdNumber: dto.IdNumber,
            OwnerPhotoRef: dto.OwnerPhotoRef,
            IdDocumentRef: dto.IdDocumentRef,
            BusinessName: dto.BusinessName,
            BusinessType: dto.BusinessType,
            BusinessCategory: dto.BusinessCategory,
            BusinessRegistrationNumber: dto.BusinessRegistrationNumber,
            BusinessDescription: dto.BusinessDescription,
            BusinessRegistrationDate: dto.BusinessRegistrationDate,
            TaxIdentificationNumber: dto.TaxIdentificationNumber,
            VatRegistrationNumber: dto.VatRegistrationNumber,
            ContactPhone: dto.ContactPhone,
            ContactEmail: dto.ContactEmail,
            WebsiteUrl: dto.WebsiteUrl,
            SocialMediaUrl: dto.SocialMediaUrl,
            AddressLine1: dto.AddressLine1,
            AddressLine2: dto.AddressLine2,
            City: dto.City,
            District: dto.District,
            Province: dto.Province,
            PostalCode: dto.PostalCode,
            Latitude: dto.Latitude,
            Longitude: dto.Longitude,
            BusinessRegistrationCertificateRef: dto.BusinessRegistrationCertificateRef,
            TinCertificateRef: dto.TinCertificateRef,
            TradeLicenceRef: dto.TradeLicenceRef,
            OtherLicenceRef: dto.OtherLicenceRef,
            StoreFrontPhotoRef: dto.StoreFrontPhotoRef,
            BusinessNameboardPhotoRef: dto.BusinessNameboardPhotoRef,
            StoreInteriorPhotoRef: dto.StoreInteriorPhotoRef,
            StoreLogoRef: dto.StoreLogoRef,
            TermsAccepted: dto.TermsAccepted,
            MarketplacePolicyAccepted: dto.MarketplacePolicyAccepted,
            InformationAccuracyConfirmed: dto.InformationAccuracyConfirmed
        );

        try
        {
            var result = await Mediator.Send(command, ct);
            return Accepted(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Conflict",
                Detail = ex.Message,
                Status = StatusCodes.Status409Conflict
            });
        }
    }

    [HttpGet("applications/status")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(VendorApplicationStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApplicationStatus(
        [FromQuery] Guid? applicationId,
        [FromQuery] string? email,
        CancellationToken ct)
    {
        Guid? currentUserId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var nameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(nameIdentifier, out var parsedId))
            {
                currentUserId = parsedId;
            }
        }

        var query = new GetVendorApplicationStatusQuery(applicationId, email, currentUserId);
        try
        {
            var result = await Mediator.Send(query, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
        }
    }
}
