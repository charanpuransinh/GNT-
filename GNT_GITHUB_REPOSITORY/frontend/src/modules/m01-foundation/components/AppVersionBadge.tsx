import { useAppStore } from '../state/app.store';
import { Badge } from '@/components/ui/Badge';

export const AppVersionBadge = () => {
  const { config } = useAppStore();

  if (!config?.version) return null;

  const envColors = {
    development: 'warning',
    staging: 'info',
    production: 'success',
  } as const;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={envColors[config.environment] || 'default'}>
        {config.environment}
      </Badge>
      <span className="text-xs text-[#64748B]">v{config.version}</span>
    </div>
  );
};
