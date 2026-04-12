global using System.Globalization;
global using System.Text.Json;

global using ClosedXML.Excel;

global using CsvHelper;
global using CsvHelper.Configuration;

global using FluentValidation;

global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.Extensions.Logging;

global using Aether.Ordering.Application.Common.Interfaces;
global using Aether.Ordering.Application.Common.Models;
global using Aether.Ordering.Application.Mappings;
global using Aether.Ordering.Application.Queries;
global using Aether.Ordering.Domain.Aggregates.OrderAggregate;
global using Aether.Ordering.Domain.Constants;
global using Aether.Ordering.Domain.Events;
global using Aether.Ordering.Domain.Models;
global using Aether.Shared.FileServices;
global using Aether.Shared.FileServices.Abstraction;
global using Aether.Shared.FileServices.Export;
global using Aether.Shared.FileServices.Import;
global using Aether.Shared.Utils;
global using ZLogger;