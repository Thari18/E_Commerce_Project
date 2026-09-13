using LocalMart.Application.DTOs;
using LocalMart.Application.Features.Products.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalMart.WebAPI.Controllers;

[ApiController]
[Route("api/v1")]
public class ProductsController : ApiController
{
    [HttpGet("categories")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var query = new GetCategoriesQuery();
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("products/search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SearchProductsResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchProducts(
        [FromQuery] string? query,
        [FromQuery] Guid? categoryId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var searchQuery = new GetProductsQuery(query, categoryId, pageNumber, pageSize);
        var result = await Mediator.Send(searchQuery, ct);
        return Ok(result);
    }

    [HttpGet("products/{idOrSlug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductDetail(string idOrSlug, CancellationToken ct = default)
    {
        var query = new GetProductDetailQuery(idOrSlug);
        var result = await Mediator.Send(query, ct);
        return Ok(result);
    }
}
