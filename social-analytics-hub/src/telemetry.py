from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from src.core.config import AppConfig


def configure_telemetry(
    app: FastAPI, app_config: AppConfig, service_name: str = "dydanmakuanalytics"
):
    otlp_endpoint = app_config.otel_exporter_otlp_endpoint

    # Create resource with service name
    resource = Resource.create({"service.name": service_name})

    # Configure Tracing
    trace_provider = TracerProvider(resource=resource)
    trace_processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
    trace_provider.add_span_processor(trace_processor)
    trace.set_tracer_provider(trace_provider)

    # Configure Metrics
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=otlp_endpoint)
    )
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument()

    return trace.get_tracer(__name__)
