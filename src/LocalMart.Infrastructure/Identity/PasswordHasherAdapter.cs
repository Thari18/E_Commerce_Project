using LocalMart.Application.Common.Interfaces;

namespace LocalMart.Infrastructure.Identity;

/// <summary>
/// TEMPORARY DEVELOPMENT ADAPTER — Password hashing algorithm and parameters remain DEFERRED per Deferred Technical Decision #6.
/// This implementation provides an isolated development adapter for IPasswordHasher and can be replaced without changing the Application layer once the password hashing specification is finalized.
/// </summary>
public class PasswordHasherAdapter : IPasswordHasher
{
    public string HashPassword(string plainTextPassword)
    {
        return BCrypt.Net.BCrypt.HashPassword(plainTextPassword);
    }

    public bool VerifyPassword(string plainTextPassword, string hashedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword)) return false;
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, hashedPassword);
    }
}
