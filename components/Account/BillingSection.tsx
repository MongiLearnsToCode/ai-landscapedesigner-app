import React, { useState, useEffect, useRef } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAppStore } from '../../stores/appStore';
import { useToastStore } from '../../stores/toastStore';
import { planPrice, SUBSCRIPTION_PLANS, type BillingCycle, type PaidPlan } from '../../constants';
import { ConfirmationModal } from '../ConfirmationModal';

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
  const syncCustomerSubscription = useAction(api.polar.syncCustomerSubscription);
  const changeSubscriptionPlan = useAction(api.polar.changeSubscriptionPlan);
  const cancelSubscription = useAction(api.polar.cancelSubscription);
  const resumeSubscription = useAction(api.polar.resumeSubscription);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isSyncingBilling, setIsSyncingBilling] = useState(false);
  const [showPlanChooser, setShowPlanChooser] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');
  const [billingAction, setBillingAction] = useState<string | null>(null);
  const [lastPlan, setLastPlan] = useState<string>('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const hasSyncedPortalReturn = useRef(false);

  // Monitor for plan changes and show notification
  useEffect(() => {
    if (userData?.subscriptionPlan && userData.subscriptionPlan !== lastPlan && lastPlan !== '') {
      addToast(`Plan updated to ${userData.subscriptionPlan}!`, 'success');
    }
    if (userData?.subscriptionPlan) {
      setLastPlan(userData.subscriptionPlan);
    }
  }, [userData?.subscriptionPlan, lastPlan, addToast]);

  useEffect(() => {
    let cancelled = false;

    const syncPortalReturn = async () => {
      const shouldSync = window.sessionStorage.getItem('polarBillingPortalReturn') === 'true';
      if (!shouldSync || hasSyncedPortalReturn.current) return;

      hasSyncedPortalReturn.current = true;
      setIsSyncingBilling(true);

      try {
        await syncCustomerSubscription();
        if (!cancelled) {
          addToast('Billing details updated.', 'success');
        }
      } catch (error) {
        console.error('Billing sync error:', error);
        hasSyncedPortalReturn.current = false;
        if (!cancelled) {
          addToast('Unable to refresh billing details. Please try again.', 'error');
        }
      } finally {
        window.sessionStorage.removeItem('polarBillingPortalReturn');
        if (!cancelled) {
          setIsSyncingBilling(false);
        }
      }
    };

    void syncPortalReturn();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncPortalReturn();
      }
    };

    window.addEventListener('focus', syncPortalReturn);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', syncPortalReturn);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncCustomerSubscription, addToast]);

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
      window.sessionStorage.setItem('polarBillingPortalReturn', 'true');
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
  const currentPeriodEnd = userData?.currentPeriodEnd
    ? new Date(userData.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const isCanceling = plan !== 'Free' && status === 'canceled';
  const paidPlans = Object.keys(SUBSCRIPTION_PLANS) as PaidPlan[];

  useEffect(() => {
    setSelectedBillingCycle(billingCycle);
  }, [billingCycle]);

  const handleChangePlan = async (targetPlan: PaidPlan) => {
    setBillingAction(`change-${targetPlan}`);
    try {
      await changeSubscriptionPlan({
        plan: targetPlan,
        billingCycle: selectedBillingCycle,
      });
      addToast(`Subscription updated to ${targetPlan}.`, 'success');
      setShowPlanChooser(false);
    } catch (error) {
      console.error('Subscription change error:', error);
      addToast('Unable to update subscription. Please try again.', 'error');
    } finally {
      setBillingAction(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelConfirmOpen(false);
    setBillingAction('cancel');
    try {
      await cancelSubscription();
      addToast('Subscription will cancel at the end of the billing period.', 'success');
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      addToast('Unable to cancel subscription. Please try again.', 'error');
    } finally {
      setBillingAction(null);
    }
  };

  const handleResumeSubscription = async () => {
    setBillingAction('resume');
    try {
      await resumeSubscription();
      addToast('Subscription resumed.', 'success');
    } catch (error) {
      console.error('Subscription resume error:', error);
      addToast('Unable to resume subscription. Please try again.', 'error');
    } finally {
      setBillingAction(null);
    }
  };

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
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      <p className="text-sm text-slate-600">
        {plan === 'Free' ? 'For more features, upgrade your plan.' : 'Manage your subscription in-app.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => plan === 'Free' ? navigateTo('pricing') : setShowPlanChooser((value) => !value)}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {plan === 'Free' ? 'Upgrade Plan' : showPlanChooser ? 'Close Plans' : 'Change Plan'}
        </button>
        {plan !== 'Free' && (
          <button
            onClick={handleManageSubscription}
            disabled={isOpeningPortal || isSyncingBilling}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpeningPortal ? 'Opening…' : isSyncingBilling ? 'Syncing…' : 'Payment & Invoices'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SectionCard title="Current Plan" footer={footer}>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center" aria-live="polite">
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
            {isCanceling && currentPeriodEnd && (
              <p className="text-sm text-orange-600 mt-1">Access continues until {currentPeriodEnd}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-4xl font-bold text-slate-800">
              ${planInfo.price}<span className="text-lg font-medium text-slate-500">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
            </p>
          </div>
        </div>
        {plan !== 'Free' && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              {isCanceling ? (
                <button
                  onClick={handleResumeSubscription}
                  disabled={billingAction !== null}
                  className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {billingAction === 'resume' ? 'Resuming…' : 'Resume Subscription'}
                </button>
              ) : (
                <button
                  onClick={() => setIsCancelConfirmOpen(true)}
                  disabled={billingAction !== null}
                  className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {billingAction === 'cancel' ? 'Canceling…' : 'Cancel at Period End'}
                </button>
              )}
            </div>
          </div>
        )}
        {showPlanChooser && plan !== 'Free' && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="font-semibold text-slate-800">Change subscription</h4>
              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setSelectedBillingCycle(cycle)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedBillingCycle === cycle
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {paidPlans.map((paidPlan) => {
                const isCurrentSelection = paidPlan === plan && selectedBillingCycle === billingCycle;
                return (
                  <button
                    key={paidPlan}
                    onClick={() => handleChangePlan(paidPlan)}
                    disabled={billingAction !== null || isCurrentSelection}
                    className={`text-left p-4 rounded-lg border transition-colors disabled:cursor-not-allowed ${
                      isCurrentSelection
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                    } ${billingAction !== null ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{paidPlan}</span>
                      {isCurrentSelection && (
                        <span className="text-xs font-medium text-orange-700">Current</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{SUBSCRIPTION_PLANS[paidPlan].description}</p>
                    <p className="mt-3 text-lg font-bold text-slate-800">
                      ${planPrice(paidPlan, selectedBillingCycle)}
                      <span className="text-sm font-medium text-slate-500">/{selectedBillingCycle === 'annual' ? 'year' : 'month'}</span>
                    </p>
                    {billingAction === `change-${paidPlan}` && (
                      <p className="mt-2 text-sm text-orange-600" role="status">Updating…</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>
      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message={currentPeriodEnd ? `Your subscription will remain active until ${currentPeriodEnd}. Are you sure you want to cancel renewal?` : 'Your subscription will stay active until the end of the current billing period. Are you sure you want to cancel renewal?'}
        confirmText="Cancel Renewal"
        cancelText="Keep Subscription"
      />
    </>
  );
};

const BillingHistory: React.FC = () => {
  return (
    <SectionCard title="Billing History">
      <p className="text-slate-500">Invoices and receipts are available from Payment & Invoices for paid subscriptions.</p>
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
