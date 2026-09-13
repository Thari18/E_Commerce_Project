namespace LocalMart.Application.DTOs;

public record VerifyVendorTokenResponseDto(
    bool IsValid,
    string? Email,
    string? Reason = null
);

public record SetVendorPasswordRequestDto(
    string Token,
    string NewPassword,
    string ConfirmPassword
);

public record SetVendorPasswordResponseDto(
    bool Success,
    string Message
);
