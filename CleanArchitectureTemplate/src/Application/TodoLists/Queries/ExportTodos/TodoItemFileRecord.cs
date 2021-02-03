using CleanArchitectureTemplate.Application.Common.Mappings;
using CleanArchitectureTemplate.Domain.Entities;

namespace CleanArchitectureTemplate.Application.TodoLists.Queries.ExportTodos
{
    public class TodoItemRecord : IMapFrom<TodoItem>
    {
        public string Title { get; set; }

        public bool Done { get; set; }
    }
}
