'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '../Icon/Icon';

type Plan = 'starter' | 'pro';
type Billing = 'yearly' | 'monthly';

const FEATURES: Record<Plan, string[]> = {
  starter: [
    'Free Play with real people and bots',
    'Puzzles AI, unlimited puzzles with AI review',
    'Game Review, analyze your games',
    'Interactive chat with Outposty your AI coach',
  ],
  pro: [
    'Free Play with real people and bots',
    'Puzzles AI, unlimited puzzles with AI review',
    'Analysis Mode, upload your games',
    'Interactive chat with Outposty your AI coach',
    'Openings AI, learn new openings and variants',
  ],
};

// Mirrors the pricing used in the mobile app's subscription screen.
const PLAN_PRICING: Record<Plan, { monthly: number; yearly: number }> = {
  starter: { monthly: 3.99, yearly: 35 },
  pro: { monthly: 10, yearly: 80 },
};

//const SUBSCRIBE_URL = 'http://localhost:8080/subscribe';
const SUBSCRIBE_URL = 'https://app.outpostchess.com/subscribe';

export type PaywallProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  defaultPlan?: Plan;
};

export const Paywall: React.FC<PaywallProps> = ({
  visible,
  onClose,
  title = 'Start winning today',
  subtitle = 'Subscribe and learn new tricks now',
  defaultPlan = 'starter',
}) => {
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [billing, setBilling] = useState<Billing>('yearly');

  // The component stays mounted (visible just toggles its own render), so
  // the useState initializer above only runs once — re-sync the selected
  // plan to whatever defaultPlan the caller passes each time it's opened.
  useEffect(() => {
    if (visible) {
      setPlan(defaultPlan);
    }
  }, [visible, defaultPlan]);

  if (!visible) return null;

  const pricing = PLAN_PRICING[plan];
  const savePercent = Math.round(
    (1 - pricing.yearly / 12 / pricing.monthly) * 100
  );

  const handleContinue = () => {
    const url = new URL(SUBSCRIBE_URL);
    url.searchParams.set('plan', plan);
    url.searchParams.set('billing', billing);
    window.location.href = url.toString();
  };

  return (
    <div className="fixed inset-0 z-[200] pt-11 md:pt-0  flex items-end justify-center bg-black-100/80 md:items-center md:px-4">
      <div 
        className="relative flex h-full  w-full flex-col overflow-y-auto animate-dialogIn md:h-auto md:max-h-[90vh] md:w-full md:max-w-[420px] md:rounded-2xl md:shadow-[0_0_50px_rgba(0,0,0,0.6),0_0_30px_rgba(7,218,99,0.25)]"
        style={{
          backgroundImage:
            'radial-gradient(61.84% 61.84% at 50% 0%, rgba(5,135,44,0.35) 0%, #01210B 70%)',
          backgroundColor: '#01210B',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full bg-black-100/30 p-1.5 text-white hover:bg-black-100/50"
        >
          <Icon name="XMarkIcon" kind="outline" className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-5 px-6 pb-8 pt-14 md:pt-10">
          <div className="relative -mx-6 -mt-14 px-6 pb-3 pt-14 md:-mt-10 md:pt-10">
            <div
              className="absolute inset-0 opacity-20 bg-center bg-cover bg-no-repeat"
              style={{
                backgroundImage:
                  "url('https://outpostchess.fra1.digitaloceanspaces.com/03c43c52-8180-4045-bb5e-4afd082cede0.webp')",
              }}
            />
            <div className="relative flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-sm text-white-200">{subtitle}</p>
              </div>

              <div className="relative flex justify-center">
                <div className="pointer-events-none absolute inset-0 m-auto h-full w-[260px] rounded-full bg-blue-600 opacity-20" />
                <div className="relative flex ">
                  {(['starter', 'pro'] as Plan[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`w-[130px] rounded-full py-2.5 text-sm font-semibold capitalize transition-colors ${
                        plan === p
                          ? 'bg-blue-600 text-black'
                          : ' text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-2 h-36">
            {FEATURES[plan].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-white"
              >
                <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="absolute inset-0.5 rounded-full bg-white" />
                  <Icon
                    name="CheckCircleIcon"
                    className="relative h-4 w-4 text-red-500"
                  />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`relative flex-1 rounded-xl border p-3 text-left ${
                billing === 'yearly'
                  ? 'border-green-800 bg-green-800/10'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              <span className="absolute -top-2.5 left-3 rounded-full bg-green-800 px-2 py-0.5 text-[10px] font-bold text-black">
                SAVE {savePercent}%
              </span>
             <span
  className={`absolute right-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
    billing === 'yearly'
      ? 'border-white/50 bg-green-800'
      : 'border-white/50 bg-[#8F8F90]'
  }`}
>
                {billing === 'yearly' && (
                  <Icon name="CheckIcon" className="h-3 w-3" />
                )}
              </span>
              <p className="mt-1 font-bold text-white-200">Yearly</p>
              <p
                className={`text-lg font-bold ${
                  billing === 'yearly' ? 'text-green-800' : 'text-white'
                }`}
              >
                €{(pricing.yearly / 12).toFixed(2)} / month
              </p>
              <p className="text-xs text-white-200">
                Billed annually €{pricing.yearly.toFixed(2)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`relative flex-1 rounded-xl border p-3 text-left ${
                billing === 'monthly'
                  ? 'border-green-800 bg-green-800/10'
                  : 'border-white/15 bg-white/10'
              }`}
            >
              <span
                className={`absolute right-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full border ${
                  billing === 'monthly'
                    ? 'border-green-800 bg-green-800'
                    : 'border-white/40 bg-[#8F8F90]'
                }`}
              >
                {billing === 'monthly' && (
                  <Icon name="CheckIcon" className="h-3 w-3 text-black" />
                )}
              </span>
              <p className="mt-1 font-bold text-white-200">Monthly</p>
              <p
                className={`text-lg font-bold ${
                  billing === 'monthly' ? 'text-green-800' : 'text-white '
                }`}
              >
                €{pricing.monthly.toFixed(2)} / month
              </p>
              <p className="text-xs text-white-200">
                Billed monthly €{pricing.monthly.toFixed(2)}
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            style={{color:'black'}}
            className="w-full rounded-full bg-green-800 py-3.5 text-base font-bold text-black transition-opacity hover:opacity-90"
          >
            Continue
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white-200">
            <span className="flex items-center gap-1 text-white">
              <Icon name="CheckIcon" className="h-3.5 w-3.5 text-green-800" />
              No ads
            </span>
            <span className="flex items-center gap-1 text-white">
              <Icon name="CheckIcon" className="h-3.5 w-3.5 text-green-800" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1 text-white">
              <Icon name="CheckIcon" className="h-3.5 w-3.5 text-green-800" />
              Secure payment
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-center text-xs text-white-200 transition-opacity hover:opacity-70"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
