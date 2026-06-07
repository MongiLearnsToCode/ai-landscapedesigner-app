import React, { useState, forwardRef, useRef, useEffect, useCallback } from 'react';
import type { Page } from '../stores/appStore';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToastStore } from '../stores/toastStore';
import { useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import {
  annualSavings,
  monthlyBreakdown,
  planPrice,
  SUBSCRIPTION_PLANS,
  type BillingCycle,
  type PaidPlan,
} from '../constants';

interface PricingPageProps {
  onNavigate: (page: Page) => void;
}

interface PlanCardProps {
  plan: PaidPlan;
  price: string;
  pricePer: string;
  monthlyBreakdown?: string;
  savings?: string;
  description: string;
  features: string[];
  cta: string;
  isPopular?: boolean;
  ribbonText?: string;
  onClick?: () => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
}

const PlanCard = forwardRef<HTMLDivElement, PlanCardProps>(({ plan, price, pricePer, monthlyBreakdown, savings, description, features, cta, isPopular, ribbonText, onClick, isLoading, isCurrentPlan }, ref) => {
  const cardClasses = isCurrentPlan
    ? 'border-orange-500 border-2 shadow-lg'
    : isPopular
    ? 'border-orange-500 border-2 transform md:scale-105 shadow-lg'
    : 'border-slate-200/80 border';

  const buttonClasses = isCurrentPlan
    ? 'bg-slate-200 text-slate-600 shadow-none'
    : isPopular
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-slate-800 hover:bg-slate-900 text-white';

  return (
    <div ref={ref} className={`relative bg-white rounded-2xl p-8 flex flex-col ${cardClasses} transition-transform duration-300`}>
      {isPopular && ribbonText && (
        <div className="absolute top-0 right-0 mr-4 -mt-3">
          <div className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 shadow-md">
            {ribbonText}
          </div>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 mr-4 -mt-3">
          <div className="bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 shadow-md">
            Current Plan
          </div>
        </div>
      )}
      <h3 className="text-2xl font-bold text-slate-800">{plan}</h3>
      <p className="mt-2 text-slate-500">{description}</p>

      <div className="mt-4 min-h-[90px]">
        <div className="flex items-baseline">
          <span className="text-5xl font-extrabold tracking-tight text-slate-900">{price}</span>
          <span className="ml-1 text-xl font-semibold text-slate-500">{pricePer}</span>
        </div>
        {monthlyBreakdown && <p className="text-slate-500 mt-1">{monthlyBreakdown}</p>}
        {savings && <p className="mt-1 text-sm font-medium text-orange-500">{savings}</p>}
      </div>

      <ul className="my-8 space-y-3 text-slate-700 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mr-2 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={isLoading || isCurrentPlan}
        className={`w-full h-11 mt-8 flex items-center justify-center text-center font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
      >
        {isLoading ? 'Processing...' : cta}
      </button>
    </div>
  );
});

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const containerRef = useRef<HTMLDivElement>(null);
  const popularCardRef = useRef<HTMLDivElement>(null);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false, isTabletPortrait: false });

  const { addToast } = useToastStore();
  const createCheckout = useAction(api.polar.createCheckout);
  const changeSubscriptionPlan = useAction(api.polar.changeSubscriptionPlan);
  const currentUser = useQuery(api.users.getCurrentUser);
  const isUserLoading = currentUser === undefined;
  const isAuthenticated = !!currentUser;
  const currentPlan = currentUser?.subscriptionPlan || 'Free';
  const currentBillingCycle = (currentUser?.billingCycle || 'monthly') as BillingCycle;
  const hasPaidPlan = currentPlan in SUBSCRIPTION_PLANS;

  const handleSubscribe = async (plan: PaidPlan, billingCycle: BillingCycle) => {
    if (isUserLoading) return;

    if (!isAuthenticated) {
      onNavigate('signin');
      return;
    }

    if (currentPlan === plan && currentBillingCycle === billingCycle) {
      return;
    }

    setIsCheckingOut(plan);
    try {
      if (hasPaidPlan) {
        await changeSubscriptionPlan({ plan, billingCycle });
        addToast(`Subscription updated to ${plan}.`, 'success');
        return;
      }

      const { url } = await createCheckout({
        plan,
        billingCycle,
        successUrl: `${window.location.origin}/success`,
        returnUrl: `${window.location.origin}/pricing`,
      });

      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      addToast('Failed to start checkout. Please try again.', 'error');
    } finally {
      setIsCheckingOut(null);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const buffer = 10;
    const canScrollLeft = scrollLeft > buffer;
    const canScrollRight = scrollLeft + clientWidth < scrollWidth - buffer;
    setScrollState(prev => ({ ...prev, canScrollLeft, canScrollRight }));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)");

    const updateLayout = () => {
      const isTabletPortrait = mediaQuery.matches;
      setScrollState(prev => ({ ...prev, isTabletPortrait }));

      if (isTabletPortrait && containerRef.current && popularCardRef.current) {
        const container = containerRef.current;
        const card = popularCardRef.current;
        const scrollLeft = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2);
        container.scrollLeft = scrollLeft;
        setTimeout(handleScroll, 50);
      }
    };

    updateLayout();
    const timeoutId = setTimeout(updateLayout, 100);

    mediaQuery.addEventListener('change', updateLayout);
    window.addEventListener('resize', updateLayout);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener('change', updateLayout);
      window.removeEventListener('resize', updateLayout);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [billingCycle, handleScroll]);

  const smoothScrollBy = (amount: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const commonFeatures = [
    "All design styles",
    "Image editing tools",
    "Advanced customization",
  ];

  const formatPrice = (plan: PaidPlan) => `$${planPrice(plan, billingCycle)}`;
  const isCurrentSelection = (plan: PaidPlan) => currentPlan === plan && currentBillingCycle === billingCycle;
  const ctaForPlan = (plan: PaidPlan) => {
    if (isCurrentSelection(plan)) return 'Current Plan';
    if (hasPaidPlan && currentPlan === plan) {
      return billingCycle === 'annual' ? 'Switch to Annual' : 'Switch to Monthly';
    }
    if (hasPaidPlan) return `Switch to ${plan}`;
    return plan === 'Personal' ? 'Get Personal' : plan === 'Creator' ? 'Choose Creator' : 'Go Business';
  };
  const annualBreakdown = (plan: PaidPlan) => `($${monthlyBreakdown(plan)}/month)`;
  const savingsText = (plan: PaidPlan) => {
    const savings = annualSavings(plan);
    const percent = Math.round((savings / (SUBSCRIPTION_PLANS[plan].monthlyPrice * 12)) * 100);
    return `Save $${savings} (${percent}%)`;
  };

  const ScrollIndicator: React.FC<{ direction: 'left' | 'right'; visible: boolean }> = ({ direction, visible }) => (
    <div
      className={`absolute top-0 bottom-0 ${direction === 'left' ? 'left-0' : 'right-0'} w-20 pointer-events-none transition-opacity duration-300 z-10
      ${visible && scrollState.isTabletPortrait ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-${direction === 'left' ? 'r' : 'l'} from-white via-white/80 to-transparent`} />
      <button
        onClick={() => smoothScrollBy(direction === 'left' ? -250 : 250)}
        className="absolute top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 rounded-full shadow-md flex items-center justify-center pointer-events-auto hover:bg-white transition-colors"
        style={{ [direction]: '1rem' }}
        aria-label={`Scroll ${direction}`}
      >
        {direction === 'left' ? <ChevronLeft className="h-6 w-6 text-slate-600" /> : <ChevronRight className="h-6 w-6 text-slate-600" />}
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) and (orientation: portrait) {
          .tablet-portrait-scroll-container {
            grid-template-columns: none;
            grid-auto-flow: column;
            grid-auto-columns: minmax(320px, 1fr);
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-top: 2rem;
            padding-bottom: 3rem;
          }
          .tablet-portrait-scroll-container > * {
            scroll-snap-align: center;
            width: 100%;
          }
          .tablet-portrait-scroll-container::-webkit-scrollbar { display: none; }
          .tablet-portrait-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}</style>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Choose the plan that's right for you
        </h2>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Start for free, then unlock more features and designs as you grow.
        </p>
        {isAuthenticated && (
          <p className="mt-4 text-sm font-medium text-slate-600">
            Your current plan is <span className="text-slate-900">{currentPlan}</span>
            {hasPaidPlan && <span> billed {currentBillingCycle}</span>}.
          </p>
        )}
      </div>

      <div className="flex justify-center items-center my-10">
        <span className={`px-4 py-2 font-medium transition ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-500'}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 ${billingCycle === 'annual' ? 'bg-orange-500' : 'bg-slate-300'}`}
          aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
        >
          <span
            className={`${
              billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
          />
        </button>
        <span className={`px-4 py-2 font-medium transition ${billingCycle === 'annual' ? 'text-slate-800' : 'text-slate-500'}`}>
          Annual
          <span className="ml-2 text-xs font-bold text-orange-700 bg-orange-100 rounded-full px-2 py-0.5">Save up to 33%</span>
        </span>
      </div>

      <div className="max-w-6xl mx-auto md:px-4 lg:px-0">
        <div className="relative">
          <ScrollIndicator direction="left" visible={scrollState.canScrollLeft} />
          <ScrollIndicator direction="right" visible={scrollState.canScrollRight} />
          <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 tablet-portrait-scroll-container">
            <PlanCard
              plan="Personal"
              price={formatPrice('Personal')}
              pricePer={billingCycle === 'monthly' ? "/ month" : "/ year"}
              monthlyBreakdown={billingCycle === 'annual' ? annualBreakdown('Personal') : undefined}
              savings={billingCycle === 'annual' ? savingsText('Personal') : undefined}
              description={SUBSCRIPTION_PLANS.Personal.description}
              features={["50 redesigns per month", ...commonFeatures]}
              cta={ctaForPlan('Personal')}
              onClick={() => handleSubscribe('Personal', billingCycle)}
              isLoading={isCheckingOut === 'Personal'}
              isCurrentPlan={isCurrentSelection('Personal')}
            />
            <PlanCard
              ref={popularCardRef}
              plan="Creator"
              price={formatPrice('Creator')}
              pricePer={billingCycle === 'monthly' ? "/ month" : "/ year"}
              monthlyBreakdown={billingCycle === 'annual' ? annualBreakdown('Creator') : undefined}
              savings={billingCycle === 'annual' ? savingsText('Creator') : undefined}
              description={SUBSCRIPTION_PLANS.Creator.description}
              features={["200 redesigns per month", ...commonFeatures]}
              cta={ctaForPlan('Creator')}
              isPopular={true}
              ribbonText={billingCycle === 'annual' ? 'Best Value' : 'Most Popular'}
              onClick={() => handleSubscribe('Creator', billingCycle)}
              isLoading={isCheckingOut === 'Creator'}
              isCurrentPlan={isCurrentSelection('Creator')}
            />
            <PlanCard
              plan="Business"
              price={formatPrice('Business')}
              pricePer={billingCycle === 'monthly' ? "/ month" : "/ year"}
              monthlyBreakdown={billingCycle === 'annual' ? annualBreakdown('Business') : undefined}
              savings={billingCycle === 'annual' ? savingsText('Business') : undefined}
              description={SUBSCRIPTION_PLANS.Business.description}
              features={["Unlimited redesigns*", ...commonFeatures, "Priority support"]}
              cta={ctaForPlan('Business')}
              onClick={() => handleSubscribe('Business', billingCycle)}
              isLoading={isCheckingOut === 'Business'}
              isCurrentPlan={isCurrentSelection('Business')}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 text-center border-t border-slate-200/80 max-w-3xl mx-auto">
        <p className="text-lg text-slate-700">
          Want to try it out first? Get 3 images free →
          <button
            onClick={() => onNavigate('main')}
            className="ml-2 font-semibold text-orange-500 hover:underline"
          >
            Start Free
          </button>
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          * 'Unlimited' is subject to a{' '}
          <button
            onClick={() => onNavigate('fair-use-policy')}
            className="underline hover:text-slate-600"
          >
            fair use policy
          </button>
          {' '}to prevent abuse.
        </p>
      </div>
    </div>
  );
};
