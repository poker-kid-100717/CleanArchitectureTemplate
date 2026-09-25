using CleanArchitectureTemplate.Domain.Entities;
using System;
using System.Linq.Expressions;

namespace CleanArchitectureTemplate.Application.TodoLists.Queries.GetTodos
{
    public class TodoItemDto
    {
        public int Id { get; set; }

        public int ListId { get; set; }

        public string Title { get; set; }

        public bool Done { get; set; }

        public int Priority { get; set; }

        public string Note { get; set; }

        /// <summary>
        /// Projection EF Core translates to SQL, so only these columns are read.
        /// </summary>
        public static Expression<Func<TodoItem, TodoItemDto>> Projection => item => new TodoItemDto
        {
            Id = item.Id,
            ListId = item.ListId,
            Title = item.Title,
            Done = item.Done,
            Priority = (int)item.Priority,
            Note = item.Note
        };
    }
}
