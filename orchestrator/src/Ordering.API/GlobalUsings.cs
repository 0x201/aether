global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Diagnostics;

global using Aether.EventBus.Abstractions;
global using Aether.Ordering.API.Infrastructure.Services;
global using Aether.Ordering.Application.Common.Interfaces;
global using Aether.Ordering.Application.Queries;
global using Aether.Ordering.Domain.Aggregates.OrderAggregate;
global using Aether.Ordering.Infrastructure;
global using Aether.Ordering.Infrastructure.Idempotency;
global using Aether.Shared.Interceptors;
global using Aether.Ordering.Infrastructure.Repositories;
