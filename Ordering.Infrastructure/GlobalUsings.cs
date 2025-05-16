global using System.Data;
global using System.Globalization;
global using System.Text.Json;

global using ClosedXML.Excel;

global using CsvHelper;
global using CsvHelper.Configuration;

global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.ChangeTracking;
global using Microsoft.EntityFrameworkCore.Diagnostics;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;
global using Microsoft.EntityFrameworkCore.Storage;
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.Logging;

global using ModernCSharp.DDD.Common;
global using ModernCSharp.IntegrationEventLogEF;
global using ModernCSharp.Ordering.Domain.Abstractions;
global using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
global using ModernCSharp.Ordering.Domain.Common.Models;
global using ModernCSharp.Ordering.Domain.Constants;
global using ModernCSharp.Ordering.Domain.Enums;
global using ModernCSharp.Ordering.Domain.Exceptions;
global using ModernCSharp.Ordering.Domain.Mappings;
global using ModernCSharp.Ordering.Domain.Models;
global using ModernCSharp.Ordering.Domain.Models.FileExport;
global using ModernCSharp.Ordering.Domain.Models.FileExtraction;
global using ModernCSharp.Ordering.Domain.Utils;
global using ModernCSharp.Ordering.Infrastructure.EntityConfigurations;
global using ModernCSharp.Ordering.Infrastructure.Idempotency;
global using ModernCSharp.Ordering.Infrastructure.Services.FileContext;
global using ModernCSharp.Ordering.Infrastructure.Services.FileContext.Strategy;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExport;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExport.Commands;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExport.Handlers;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExtraction;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExtraction.Commands;
global using ModernCSharp.Ordering.Infrastructure.Services.FileExtraction.Handlers;
