using CleanArchitectureTemplate.Domain.Common;
using CleanArchitectureTemplate.Domain.Entities;

namespace CleanArchitectureTemplate.Domain.Events
{
    public class TodoItemCreatedEvent : DomainEvent
    {
        public TodoItemCreatedEvent(TodoItem item)
        {
            Item = item;
        }

        public TodoItem Item { get; }
    }
}
