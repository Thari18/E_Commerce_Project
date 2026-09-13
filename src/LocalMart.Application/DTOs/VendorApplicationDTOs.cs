namespace LocalMart.Application.DTOs;

public record SubmitVendorApplicationRequestDto(
    Guid? ApplicantUserId,
    string BusinessName,
    string BusinessRegistrationNumber,
    string? TaxIdentificationNumber,
    string ContactPhone,
    string ContactEmail
);

public record VendorApplicationResponseDto(
    Guid ApplicationId,
    string Status,
    DateTime SubmittedAt,
    string Message
);

public record VendorApplicationStatusDto(
    Guid ApplicationId,
    string BusinessName,
    string Status,
    string? RejectionReason,
    DateTime SubmittedAt
);

public record VendorApplicationDetailDto(
    Guid Id,
    Guid ApplicantUserId,
    string ApplicantName,
    string BusinessName,
    string BusinessRegistrationNumber,
    string? TaxIdentificationNumber,
    string ContactPhone,
    string ContactEmail,
    string Status,
    string? RejectionReason,
    Guid? ReviewedByAdminId,
    DateTime SubmittedAt,
    DateTime? ReviewedAt
);

public record ApproveVendorApplicationRequestDto(
    decimal CommissionRate = 10.00m
);

public record ApproveVendorApplicationResponseDto(
    Guid ApplicationId,
    Guid VendorId,
    string Status,
    string Message
);

public record RejectVendorApplicationRequestDto(
    string RejectionReason
);

public record RejectVendorApplicationResponseDto(
    Guid ApplicationId,
    string Status,
    string RejectionReason,
    string Message
);
