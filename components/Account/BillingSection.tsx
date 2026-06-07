import React, { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';
import { planPrice, SUBSCRIPTION_PLANS, type BillingCycle, type PaidPlan } from '../../constants';

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
  const { addToast } = useToastStore();
  const userData = useQuery(api.users.getCurrentUser);
  const createCustomerPortalSession = useAction(api.polar.createCustomerPortalSession);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [lastPlan, setLastPlan] = useState<string>('');

  // Monitor for plan changes and show notification
  useEffect(() => {
    if (userData?.subscriptionPlan && userData.subscriptionPlan !== lastPlan && lastPlan !== '') {
      addToast(`Plan updated to ${userData.subscriptionPlan}!`, 'success');
    }
    if (userData?.subscriptionPlan) {
      setLastPlan(userData.subscriptionPlan);
    }
  }, [userData?.subscriptionPlan, lastPlan, addToast]);

  const handleManageSubscription = async () => {
    if (plan === 'Free') {
      navigateTo('pricing');
      return;
    }

    setIsOpeningPortal(true);
    try {
      const { url } = await createCustomerPortalSession({
        returnUrl: window.location.href,
      });
      window.location.href = url;
    } catch (error) {
      console.error('Customer portal error:', error);
      addToast('Unable to open billing portal. Please try again.', 'error');
      setIsOpeningPortal(false);
    }
  };

  const plan = userData?.subscriptionPlan || 'Free';
  const status = userData?.subscriptionStatus || 'active';
  const billingCycle = (userData?.billingCycle || 'monthly') as BillingCycle;

  const getPlanInfo = (planName: string) => {
    if (planName in SUBSCRIPTION_PLANS) {
      const paidPlan = planName as PaidPlan;
      return {
        price: planPrice(paidPlan, billingCycle),
        description: SUBSCRIPTION_PLANS[paidPlan].description,
      };
    }

    return { price: 0, description: 'Our basic free-forever plan' };
  };

  const planInfo = getPlanInfo(plan);

  const footer = (
    <div className="flex justify-between items-center">
      <p className="text-sm text-slate-600">
        {plan === 'Free' ? 'For more features, upgrade your plan.' : 'Manage your subscription'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigateTo('pricing')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {plan === 'Free' ? 'Upgrade Plan' : 'Change Plan'}
        </button>
        {plan !== 'Free' && (
          <button
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpeningPortal ? 'Opening...' : 'Manage Billing'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <SectionCard title="Current Plan" footer={footer}>
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-slate-800">{plan} Plan</p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-slate-500">{planInfo.description}</p>
          {billingCycle && plan !== 'Free' && (
            <p className="text-sm text-slate-400 mt-1">Billed {billingCycle}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-slate-800">
            ${planInfo.price}<span className="text-lg font-medium text-slate-500">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
          </p>
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
