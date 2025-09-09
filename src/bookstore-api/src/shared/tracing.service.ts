import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OtelConfig } from './otel.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TracingService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TracingService.name);
  private sdk: NodeSDK;
  private readonly otelConfig: OtelConfig;

  constructor(private configService: ConfigService) {

    this.otelConfig = this.configService.get<OtelConfig>('otelConfig');

    
    this.logger.log(`Initializing OpenTelemetry with OTLP endpoint: ${this.otelConfig.otelServer}`);
    this.logger.log(`Service name: ${this.otelConfig.serviceName}`);

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: this.otelConfig.serviceName,
        [ATTR_SERVICE_VERSION]: '0.1.0'
      }),
      logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
      traceExporter: new OTLPTraceExporter({
        url: this.otelConfig.otelServer
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: this.otelConfig.otelServer
        }),
        exportIntervalMillis: 5000
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false
          }},
        ), new GrpcInstrumentation(),]
    });
  }

  async onModuleInit() {
    try {
      this.sdk.start();
      this.logger.log('OpenTelemetry SDK started successfully');
      
      // Force a quick export to test the connection
      setTimeout(() => {
        this.logger.log('Sending test telemetry data...');
      }, 2000);
    } catch (error) {
      this.logger.error('Failed to start OpenTelemetry SDK:', error);
    }
  }

  async onApplicationShutdown() {
    try {
      await this.sdk.shutdown();
      this.logger.log('OpenTelemetry SDK shut down successfully');
    } catch (error) {
      this.logger.log('Error shutting down OpenTelemetry SDK', error);
    }
  }
}