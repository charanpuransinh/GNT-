quick_start:
  1. Ensure Redis and PostgreSQL are running
  2. Run migrations: npx prisma migrate dev --schema=modules/m13/prisma/schema.prisma
  3. Seed action definitions: npm run seed:actions
  4. Start API: npm run dev:api
  5. Start Worker: npm run dev:worker
  6. Start Scheduler: npm run dev:scheduler

common_tasks:
  add_new_action:
    - Create handler in src/backend/actions/
    - Register in ActionRegistryService
    - Add UI component in src/frontend/components/actions/
    - Update API_CONTRACT.yaml
  debug_execution:
    - Check m13_automation_logs filtered by executionId
    - Review step execution sequence in m13_workflow_step_executions
    - Verify trigger config in m13_workflow_triggers
  troubleshoot_scheduler:
    - Verify SCHEDULER_ENABLED=true
    - Check Redis leader lock exists
    - Review nextRunAt values in m13_scheduled_jobs

contact:
  module_owner: Team-C Lead
  slack_channel: #gnt-team-c-automation
  oncall_rotation: Team-C Rotation
