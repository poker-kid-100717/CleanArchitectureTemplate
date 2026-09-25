using CleanArchitectureTemplate.Domain.Entities;
using System;
using System.Linq.Expressions;

namespace CleanArchitectureTemplate.Application.TodoLists.Queries.ExportTodos
{
    public class TodoItemRecord
    {
        public string Title { get; set; }

        public bool Done { get; set; }

        public static Expression<Func<TodoItem, TodoItemRecord>> Projection => item => new TodoItemRecord
        {
            Title = item.Title,
            Done = item.Done
        };
    }
}
