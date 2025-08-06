import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AllowAnonymous } from './auth/auth.guard';
import { trace } from '@opentelemetry/api';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AllowAnonymous()
  @Get("/health")
  health(): string {
    return "Healthy";
  }

  
  @AllowAnonymous()
  @Get('test-telemetry')
  getTestTelemetry(): string {
    // Create a simple span to test telemetry
    const tracer = trace.getTracer('nestjs-app');
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
