global using System.Collections.Concurrent;
global using System.Linq.Dynamic.Core;

global using DyDanmaku.API;
global using DyDanmaku.API.Dtos;
global using DyDanmaku.API.Enums;
global using DyDanmaku.API.Hubs;
global using DyDanmaku.API.Interfaces;
global using DyDanmaku.API.Services;
global using DyDanmaku.Domain.Entity;
global using DyDanmaku.Infrastructure;

global using Microsoft.AspNetCore.Hosting;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.AspNetCore.SignalR;
global using Microsoft.EntityFrameworkCore;

global using ModernCSharp.ServiceDefaults;
global using ModernCSharp.Shared;

global using Scalar.AspNetCore;

global using DyDanmaku.Application.IntegrationEvents.Events;
global using ModernCSharp.EventBus.Abstractions;