using CleanArchitectureTemplate.Application.Common.Interfaces;
using CleanArchitectureTemplate.Application.Common.Security;
using CleanArchitectureTemplate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitectureTemplate.Application.TodoLists.Queries.GetTodos
{
    public class GetTodosQuery : IRequest<TodosVm>
    {
    }

    public class GetTodosQueryHandler : IRequestHandler<GetTodosQuery, TodosVm>
    {
        private readonly IApplicationDbContext _context;

        public GetTodosQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TodosVm> Handle(GetTodosQuery request, CancellationToken cancellationToken)
        {
            return new TodosVm
            {
                PriorityLevels = Enum.GetValues(typeof(PriorityLevel))
                    .Cast<PriorityLevel>()
                    .Select(p => new PriorityLevelDto { Value = (int)p, Name = p.ToString() })
                    .ToList(),

                Lists = await _context.TodoLists
                    .AsNoTracking()
                    .Select(TodoListDto.Projection)
                    .OrderBy(t => t.Title)
                    .ToListAsync(cancellationToken)
            };
        }
    }
}
