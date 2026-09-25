using CleanArchitectureTemplate.Application.Common.Interfaces;
using CleanArchitectureTemplate.Application.Common.Mappings;
using CleanArchitectureTemplate.Application.Common.Models;
using CleanArchitectureTemplate.Application.TodoLists.Queries.GetTodos;
using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitectureTemplate.Application.TodoItems.Queries.GetTodoItemsWithPagination
{
    public class GetTodoItemsWithPaginationQuery : IRequest<PaginatedList<TodoItemDto>>
    {
        public int ListId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class GetTodoItemsWithPaginationQueryHandler : IRequestHandler<GetTodoItemsWithPaginationQuery, PaginatedList<TodoItemDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetTodoItemsWithPaginationQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedList<TodoItemDto>> Handle(GetTodoItemsWithPaginationQuery request, CancellationToken cancellationToken)
        {
            return await _context.TodoItems
                .Where(x => x.ListId == request.ListId)
                .OrderBy(x => x.Title)
                .Select(TodoItemDto.Projection)
                .PaginatedListAsync(request.PageNumber, request.PageSize);
        }
    }
}
