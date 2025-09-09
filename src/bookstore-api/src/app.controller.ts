import { Controller, Get, UseGuards } from '@nestjs/common';
import { AllowAnonymous } from './auth/auth.guard';
import { trace } from '@opentelemetry/api';
import { AuthGuard } from '@nestjs/passport';
import { DataSeedService } from './data-seed/data-seed.service';

@Controller()
export class AppController {
  constructor(private readonly dataSeedService: DataSeedService) {}

  @AllowAnonymous()
  @Get("/health")
  health(): string {
    return "Healthy";
  }

  @AllowAnonymous()
  @Get("/seed-data")
  seedAsync(): void {
    this.dataSeedService.seedAsync();
  }

  
  @AllowAnonymous()
  @Get('test-telemetry')
  getTestTelemetry(): string {
    // Create a simple span to test telemetry
    const tracer = trace.getTracer('bookstore-api');
    const span = tracer.startSpan('test-telemetry-operation');
    
    try {
      span.setAttribute('test.attribute', 'test-value');
      span.addEvent('Test event generated');
      return 'Telemetry test successful - check Aspire dashboard for traces';
    } finally {
      span.end();
    }
  }
}
