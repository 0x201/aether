global using System.Data;
global using MediatR;
global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Design;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;
global using Microsoft.EntityFrameworkCore.Storage;
global using Microsoft.EntityFrameworkCore.ChangeTracking;
global using Microsoft.EntityFrameworkCore.Diagnostics;

global using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
global using ModernCSharp.Ordering.Domain.Exceptions;
global using ModernCSharp.DDD.Common;
global using ModernCSharp.Ordering.Infrastructure.EntityConfigurations;
global using ModernCSharp.Ordering.Infrastructure.Idempotency;
