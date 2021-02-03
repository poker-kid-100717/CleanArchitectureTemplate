using CleanArchitectureTemplate.Domain.Common;
using System.Threading.Tasks;

namespace CleanArchitectureTemplate.Application.Common.Interfaces
{
    public interface IDomainEventService
    {
        Task Publish(DomainEvent domainEvent);
    }
}
