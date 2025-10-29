
import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';

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

const CurrentPlan: React.FC = () => {
  const { navigateTo } = useAppStore();
  const userData = useQuery(api.users.getUser);
  const plan = userData?.subscriptionPlan || 'Free';
  const price = plan === 'Free' ? 0 : (plan === 'Pro' ? 10 : 0); // Example pricing

  const footer = (
    <div className="flex justify-between items-center">
      <p className="text-sm text-slate-600">For more features, upgrade your plan.</p>
      <button 
        onClick={() => navigateTo('pricing')}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
      >
        {plan === 'Free' ? 'Upgrade Plan' : 'Change Plan'}
      </button>
    </div>
  );

  return (
    <SectionCard title="Current Plan" footer={footer}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xl font-bold text-slate-800">{plan} Plan</p>
          <p className="text-slate-500">Our basic free-forever plan.</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-slate-800">${price}<span className="text-lg font-medium text-slate-500">/month</span></p>
        </div>
      </div>
    </SectionCard>
  );
};

const BillingHistory: React.FC = () => {
  // In a real app, you would fetch and display billing history here.
  return (
    <SectionCard title="Billing History">
      <p className="text-slate-500">No billing history found. Invoices for your subscription will appear here.</p>
    </SectionCard>
  );
};

export const BillingSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <CurrentPlan />
      <BillingHistory />
    </div>
  );
};
