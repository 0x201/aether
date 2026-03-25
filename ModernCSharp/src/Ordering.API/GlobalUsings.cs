global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Diagnostics;

global using ModernCSharp.EventBus.Abstractions;
global using ModernCSharp.Ordering.API.Infrastructure.Services;
global using ModernCSharp.Ordering.Application.Common.Interfaces;
global using ModernCSharp.Ordering.Application.Queries;
global using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
global using ModernCSharp.Ordering.Infrastructure;
global using ModernCSharp.Ordering.Infrastructure.Idempotency;
global using ModernCSharp.Shared.Interceptors;
global using ModernCSharp.Ordering.Infrastructure.Repositories;
