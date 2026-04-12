global using System.Data;

global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.ChangeTracking;
global using Microsoft.EntityFrameworkCore.Diagnostics;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;
global using Microsoft.EntityFrameworkCore.Storage;

global using Aether.DDD.Common;
global using Aether.IntegrationEventLogEF;
global using Aether.Ordering.Domain.Aggregates.OrderAggregate;
global using Aether.Ordering.Domain.Exceptions;
global using Aether.Ordering.Infrastructure.EntityConfigurations;
global using Aether.Ordering.Infrastructure.Idempotency;
