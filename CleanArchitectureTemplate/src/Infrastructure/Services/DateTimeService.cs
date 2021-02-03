using CleanArchitectureTemplate.Application.Common.Interfaces;
using System;

namespace CleanArchitectureTemplate.Infrastructure.Services
{
    public class DateTimeService : IDateTime
    {
        public DateTime Now => DateTime.Now;
    }
}
