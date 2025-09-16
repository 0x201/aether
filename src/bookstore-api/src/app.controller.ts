import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from './auth/auth.guard';
import { trace } from '@opentelemetry/api';
import { DataSeedService } from './data-seed/data-seed.service';

@Controller()
export class AppController {
  constructor(private readonly dataSeedService: DataSeedService) { }

  @AllowAnonymous()
  @Get('/health')
  health(): string {
    return 'Healthy';
  }

  @AllowAnonymous()
  @Get('/seed-data')
  async seedAsync(): Promise<{}> {
    await this.dataSeedService.seedAsync();
    return { statusCode: 200, message: 'Data seeded successfully' };
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
