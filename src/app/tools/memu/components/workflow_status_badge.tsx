import React from "react";
import { AlertTriangle, Beaker, Shield, Archive } from "lucide-react";

interface workflow_status_badge_props {
  status?: 'stable' | 'early_access' | 'experimental' | 'deprecated';
  size?: 'sm' | 'md';
}

export default function workflow_status_badge({ 
  status = 'stable', 
  size = 'sm' 
}: workflow_status_badge_props) {
  if (status === 'stable') return null;

  const get_badge_config = () => {
    switch (status) {
      case 'early_access':
        return {
          label: 'Early Access',
          className: 'badge-warning',
          icon: AlertTriangle,
          tooltip: 'This workflow is in early access and may have bugs or incomplete features'
        };
      case 'experimental':
        return {
          label: 'Beta',
          className: 'badge-error',
          icon: Beaker,
          tooltip: 'This workflow is experimental and may be unstable'
        };
      case 'deprecated':
        return {
          label: 'Deprecated',
          className: 'badge-neutral',
          icon: Archive,
          tooltip: 'This workflow is deprecated and will be removed in a future version'
        };
      default:
        return {
          label: 'Stable',
          className: 'badge-success',
          icon: Shield,
          tooltip: 'This workflow is stable and ready for production use'
        };
    }
  };

  const config = get_badge_config();
  const Icon = config.icon;
  const badge_size = size === 'sm' ? 'badge-sm' : '';

  return (
    <div 
      className={`badge ${config.className} ${badge_size} gap-1 cursor-help`}
      title={config.tooltip}
    >
      <Icon className="w-3 h-3" />
      <span className="text-xs">{config.label}</span>
    </div>
  );
}