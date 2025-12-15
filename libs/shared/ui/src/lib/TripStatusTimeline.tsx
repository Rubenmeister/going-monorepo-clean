'use client';

import React from 'react';

export interface TimelineEvent {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'warning';
  title: string;
  description?: string;
  timestamp?: string;
  icon?: string;
}

interface TripStatusTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusConfig = {
  pending: { color: 'bg-gray-300', ring: 'ring-gray-100', text: 'text-gray-500' },
  active: { color: 'bg-going-red', ring: 'ring-going-red/20', text: 'text-going-red' },
  completed: { color: 'bg-green-500', ring: 'ring-green-100', text: 'text-green-600' },
  cancelled: { color: 'bg-red-500', ring: 'ring-red-100', text: 'text-red-600' },
  warning: { color: 'bg-going-yellow', ring: 'ring-going-yellow/20', text: 'text-amber-600' },
};

export function TripStatusTimeline({ events, className = '' }: TripStatusTimelineProps) {
  return (
    <div className={`relative ${className}`}>
      {events.map((event, index) => {
        const config = statusConfig[event.status];
        const isLast = index === events.length - 1;
        
        return (
          <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline dot and line */}
            <div className="relative flex flex-col items-center">
              <div className={`
                w-4 h-4 rounded-full ${config.color} ring-4 ${config.ring}
                flex items-center justify-center z-10
              `}>
                {event.status === 'completed' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                {event.icon && <span>{event.icon}</span>}
                <h4 className={`font-medium ${event.status === 'active' ? config.text : 'text-gray-900'}`}>
                  {event.title}
                </h4>
              </div>
              {event.description && (
                <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
              )}
              {event.timestamp && (
                <p className="text-xs text-gray-400 mt-1">{event.timestamp}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TripStatusTimeline;
