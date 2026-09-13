namespace LocalMart.Domain.Common;

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}
