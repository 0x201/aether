global using System.Globalization;
global using System.Text.Json;

global using AutoMapper;
global using AutoMapper.QueryableExtensions;

global using ClosedXML.Excel;

global using CsvHelper;
global using CsvHelper.Configuration;

global using FluentValidation;

global using MediatR;

global using Microsoft.EntityFrameworkCore;
global using Microsoft.Extensions.Logging;

global using ModernCSharp.Ordering.Application.Common.Interfaces;
global using ModernCSharp.Ordering.Application.Common.Models;
global using ModernCSharp.Ordering.Application.Mappings;
global using ModernCSharp.Ordering.Domain.Aggregates.OrderAggregate;
global using ModernCSharp.Ordering.Domain.Constants;
global using ModernCSharp.Ordering.Domain.Events;
global using ModernCSharp.Ordering.Domain.Models;
global using ModernCSharp.Shared.FileServices;
global using ModernCSharp.Shared.FileServices.Export;
global using ModernCSharp.Shared.FileServices.Import;
