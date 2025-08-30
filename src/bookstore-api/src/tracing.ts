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

const otlpServer = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:19109';
const serviceName = process.env.OTEL_SERVICE_NAME || 'bookstore-api';

console.log(`Initializing OpenTelemetry with OTLP endpoint: ${otlpServer}`);
console.log(`Service name: ${serviceName}`);


const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: '0.1.0'
    }),
    logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
    traceExporter: new OTLPTraceExporter({
        url: otlpServer
    }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: otlpServer
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

try {
    sdk.start();
    console.log('OpenTelemetry SDK started successfully');
    
    // Force a quick export to test the connection
    setTimeout(() => {
        console.log('Sending test telemetry data...');
    }, 2000);
} catch (error) {
    console.error('Failed to start OpenTelemetry SDK:', error);
}

process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('SDK shut down successfully'))
        .catch((error) => console.log('Error shutting down SDK', error))
        .finally(() => process.exit(0));
});