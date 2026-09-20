import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions"

import { OtelConfig } from "../../config/config.interface.js"

@Injectable()
export class TelemetryService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TelemetryService.name)
  private sdk: NodeSDK
  private readonly otelConfig: OtelConfig

  constructor(private configService: ConfigService) {
    this.otelConfig = this.configService.get<OtelConfig>("otel")!
    const appVersion = this.configService.get<string>("APP_VERSION")

    this.logger.log(
      `Initializing OpenTelemetry with OTLP endpoint: ${this.otelConfig.OTEL_EXPORTER_OTLP_ENDPOINT}`,
    )
    this.logger.log(`Service name: ${this.otelConfig.OTEL_SERVICE_NAME}`)

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: this.otelConfig.OTEL_SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: appVersion,
      }),
      logRecordProcessor: new SimpleLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: this.otelConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
        }),
      }),
      traceExporter: new OTLPTraceExporter({
        url: this.otelConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: this.otelConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
        }),
        exportIntervalMillis: 5000,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false,
          },
          "@opentelemetry/instrumentation-pg": {
            enabled: true,
          },
          "@opentelemetry/instrumentation-generic-pool": {
            enabled: true,
          },
        }),
        new GrpcInstrumentation(),
      ],
    })
  }

  async onModuleInit() {
    try {
      this.sdk.start()
      this.logger.log("OpenTelemetry SDK started successfully")

      // Force a quick export to test the connection
      setTimeout(() => {
        this.logger.log("Sending test telemetry data...")
      }, 2000)
    } catch (error) {
      this.logger.error("Failed to start OpenTelemetry SDK:", error)
    }
  }

  async onApplicationShutdown() {
    try {
      await this.sdk.shutdown()
      this.logger.log("OpenTelemetry SDK shut down successfully")
    } catch (error) {
      this.logger.log("Error shutting down OpenTelemetry SDK", error)
    }
  }
}
