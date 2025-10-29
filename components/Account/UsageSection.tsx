
import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const SectionCard: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
  <div className="bg-white rounded-lg shadow-md">
    <div className="p-6 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
    {footer && (
      <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-lg">
        {footer}
      </div>
    )}
  </div>
);

export const UsageSection: React.FC = () => {
  const userData = useQuery(api.users.getUser);

  const used = userData?.redesignsUsedThisMonth || 0;
  const limit = userData?.monthlyRedesignLimit || 3;

  const percentage = limit <= 0 ? 0 : Math.max(0, Math.min(100, (used / limit) * 100));
  const summariesLeft = Math.max(0, limit - used);
  const displayedUsed = Math.min(used, limit);

  return (
    <SectionCard title="Current Usage">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-slate-700">Monthly Summaries</h4>
            <p className="text-sm text-slate-500">{displayedUsed} of {limit} used</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div 
              className="bg-orange-500 h-2.5 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          You have <span className="font-bold">{summariesLeft} summaries</span> left. Your usage will reset on the 1st of next month.
        </p>
      </div>
    </SectionCard>
  );
};
