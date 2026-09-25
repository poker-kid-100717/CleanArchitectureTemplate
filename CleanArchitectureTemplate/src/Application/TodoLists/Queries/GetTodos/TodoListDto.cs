using CleanArchitectureTemplate.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace CleanArchitectureTemplate.Application.TodoLists.Queries.GetTodos
{
    public class TodoListDto
    {
        public TodoListDto()
        {
            Items = new List<TodoItemDto>();
        }

        public int Id { get; set; }

        public string Title { get; set; }

        public string Colour { get; set; }

        public IList<TodoItemDto> Items { get; set; }

        /// <summary>
        /// Projection EF Core translates to SQL, including the nested items.
        /// </summary>
        public static Expression<Func<TodoList, TodoListDto>> Projection => list => new TodoListDto
        {
            Id = list.Id,
            Title = list.Title,
            Colour = list.Colour.Code,
            Items = list.Items.AsQueryable().Select(TodoItemDto.Projection).ToList()
        };
    }
}
