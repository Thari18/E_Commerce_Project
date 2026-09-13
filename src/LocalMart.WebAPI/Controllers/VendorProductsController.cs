using System.Security.Claims;
using LocalMart.Application.DTOs;
using LocalMart.Application.Features.VendorCatalog.Commands;
using LocalMart.Application.Features.VendorCatalog.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1/vendor/products")]
[Authorize(Roles = "Vendor")]
public class VendorProductsController : ApiController
{
    [HttpGet]
    [ProducesResponseType(typeof(VendorProductsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVendorProducts(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        var query = new GetVendorProductsQuery(userId, status, pageNumber, pageSize);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CreateProductResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequestDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var command = new CreateProductCommand(
            userId,
            dto.CategoryId,
            dto.Name,
            dto.Description,
            dto.Sku,
            dto.Price,
            dto.Status,
            dto.InitialQuantity,
            dto.LowStockThreshold,
            dto.ImageUrls
        );

        var result = await Mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetVendorProducts), new { id = result.ProductId }, result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(VendorProductItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequestDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateProductCommand(
            userId,
            id,
            dto.CategoryId,
            dto.Name,
            dto.Description,
            dto.Sku,
            dto.Price
        );

        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(VendorProductItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProductStatus(Guid id, [FromBody] UpdateProductStatusRequestDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateProductStatusCommand(userId, id, dto.Status);
        var result = await Mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadProductImage(IFormFile file, [FromServices] LocalMart.Application.Common.Interfaces.IPhotoService photoService)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Please select a valid image file." });
        }

        using var stream = file.OpenReadStream();
        var imageUrl = await photoService.UploadImageAsync(stream, file.FileName, "products");

        if (string.IsNullOrEmpty(imageUrl))
        {
            return BadRequest(new { message = "Failed to upload image to Cloudinary." });
        }

        return Ok(new { imageUrl });
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(claim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid or missing user context.");
        }
        return userId;
    }
}
