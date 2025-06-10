/**
 * Plan Badge Component
 * Displays user plan type with appropriate styling and information
 */

import React from 'react';
import { getPlanDisplayInfo } from '@/lib/plan_config';

interface PlanBadgeProps {
  plan: string;
  show_details?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card' | 'inline';
}

export function PlanBadge({ 
  plan, 
  show_details = false, 
  size = 'md',
  variant = 'badge' 
}: PlanBadgeProps) {
  const plan_info = getPlanDisplayInfo(plan);
  
  // Plan-specific styling
  const get_plan_styles = () => {
    switch (plan) {
      case 'admin':
        return {
          badge: 'badge-error text-white',
          card: 'border-red-500 bg-red-50',
          text: 'text-red-600',
          icon: '🛡️'
        };
      case 'standard':
        return {
          badge: 'badge-primary text-white',
          card: 'border-blue-500 bg-blue-50',
          text: 'text-blue-600',
          icon: '⭐'
        };
      case 'free':
      default:
        return {
          badge: 'badge-ghost',
          card: 'border-gray-300 bg-gray-50',
          text: 'text-gray-600',
          icon: '🆓'
        };
    }
  };
  
  const styles = get_plan_styles();
  
  // Size variants
  const size_classes = {
    sm: variant === 'badge' ? 'badge-sm text-xs' : 'text-sm',
    md: variant === 'badge' ? 'badge-md text-sm' : 'text-base',
    lg: variant === 'badge' ? 'badge-lg text-base' : 'text-lg'
  };

  if (variant === 'badge') {
    return (
      <div className={`badge ${styles.badge} ${size_classes[size]} font-medium`}>
        <span className="mr-1">{styles.icon}</span>
        {plan_info.name}
        {plan_info.isUnlimited && (
          <span className="ml-1 text-xs">∞</span>
        )}
      </div>
    );
  }

  if (variant === 'card' && show_details) {
    return (
      <div className={`card border ${styles.card} p-4`}>
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{styles.icon}</span>
          <div>
            <h3 className={`font-bold ${size_classes[size]} ${styles.text}`}>
              {plan_info.name} Plan
            </h3>
            <p className="text-sm text-gray-600">{plan_info.description}</p>
          </div>
        </div>
        
        {plan_info.features.length > 0 && (
          <div className="mt-3">
            <h4 className="font-semibold text-sm mb-1">Features:</h4>
            <ul className="text-sm space-y-1">
              {plan_info.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
              {plan_info.features.length > 3 && (
                <li className="text-gray-500">
                  +{plan_info.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}
        
        {plan_info.isUnlimited && (
          <div className="mt-3 p-2 bg-green-100 rounded text-green-700 text-sm">
            <span className="font-semibold">Unlimited Usage</span> - No token limits
          </div>
        )}
        
        {plan_info.isInternal && (
          <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-700 text-sm">
            <span className="font-semibold">Internal Access</span> - Admin privileges
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <span className={`inline-flex items-center ${size_classes[size]} ${styles.text} font-medium`}>
      <span className="mr-1">{styles.icon}</span>
      {plan_info.name}
      {plan_info.isUnlimited && (
        <span className="ml-1 text-xs opacity-75">∞</span>
      )}
    </span>
  );
}

/**
 * Hook for getting plan badge props
 */
export function usePlanBadge(plan: string) {
  const plan_info = getPlanDisplayInfo(plan);
  
  return {
    plan_info,
    is_unlimited: plan_info.isUnlimited,
    is_internal: plan_info.isInternal,
    display_name: plan_info.name
  };
}