api_latency:
  workflow_list: <50ms (100 records)
  workflow_detail: <30ms
  execution_list: <100ms (with pagination)
  execution_detail: <50ms
  webhook_ingest: <20ms (async ack pattern)

engine_throughput:
  concurrent_executions: 100 per worker instance
  executions_per_minute: 1000 per tenant
  max_workflow_steps: 50 per workflow
  max_execution_depth: 10 (nested sub-workflows)

database:
  query_time: <20ms per query
  connection_pool: 20 per instance
  max_execution_logs: 10M per tenant (rotation)

frontend:
  builder_load: <2s initial load
  execution_monitor_refresh: 3s polling
  max_workflow_nodes_render: 100
