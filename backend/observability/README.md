# Grafana Cloud Observability

## What is included

- OpenTelemetry Collector config: `backend/observability/otel-collector-config.yaml`
- Dashboard skeleton: `backend/observability/grafana/dashboard-kafka-rpc-saga.json`
- Alert skeleton: `backend/observability/grafana/alerts-skeleton.yaml`

## Environment variables

Set these in `backend/.env` before starting the collector:

- `GRAFANA_CLOUD_USER_ID`
- `GRAFANA_CLOUD_API_KEY`
- `GRAFANA_CLOUD_OTLP_ENDPOINT`
- `GRAFANA_CLOUD_PROM_REMOTE_WRITE_ENDPOINT`
- `GRAFANA_CLOUD_LOKI_ENDPOINT`
- `OTEL_EXPORTER_OTLP_ENDPOINT` (default local collector: `http://127.0.0.1:4318`)

## Run

- `task observability:start`
- `task observability:down`
- `task observability:check-env`

## Notes

- Kafka RPC and saga app-level observability are emitted as structured logs by:
  - `requestKafkaRpc` (`event=kafka_rpc`)
  - `order-service` saga (`event=order_checkout_saga`)
- The dashboard and alerts are skeletons and may need adaptation to your Grafana Cloud datasource UIDs and log-to-metric pipeline.
- The provided dashboard/alert expressions are LogQL-first, based on structured logs emitted by:
  - `event="kafka_rpc"`
  - `event="order_checkout_saga"`
- `task observability:start` auto-loads env from `backend/.env` before running collector.

## Verify export pipelines

1. Fill Grafana Cloud variables in `backend/.env`.
2. Run `task observability:check-env`.
3. Run `task observability:start`.
4. Check collector logs:
   - `docker compose logs --no-color otel-collector`

If you keep placeholder Grafana endpoints/credentials, collector stays healthy but exporters will log delivery errors. This is expected until real credentials are provided.
