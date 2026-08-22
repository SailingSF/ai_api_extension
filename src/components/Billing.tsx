import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { CreditCard, Settings, Sparkles } from 'lucide-react';
import InPageNavbar from './InPageNavbar';
import { useAccount } from '../useAccount';
import type { BillingCatalog, CreditPack, SubscriptionPlan } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

interface BillingProps {
  openAuthModal: (message?: string) => void;
}

const Billing: React.FC<BillingProps> = ({ openAuthModal }) => {
  const { account, isLoading: isLoadingAccount } = useAccount();
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!localStorage.getItem('token');

  // The catalog is public, so it renders for signed-out visitors too -- the pricing
  // page doubles as marketing.
  useEffect(() => {
    if (!API_BASE_URL) {
      setError('Missing REACT_APP_API_BASE_URL');
      return;
    }
    axios
      .get<BillingCatalog>(`${API_BASE_URL}/api/billing/products/`)
      .then((r) => setCatalog(r.data))
      .catch(() => setError('Could not load pricing. Please try again.'));
  }, []);

  const startCheckout = async (productKey: string): Promise<void> => {
    if (!isLoggedIn) {
      openAuthModal('Please log in to buy credits.');
      return;
    }
    setPendingKey(productKey);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<{ checkout_url: string }>(
        `${API_BASE_URL}/api/billing/checkout/`,
        { product_key: productKey },
        { headers: { Authorization: `Token ${token}` } }
      );
      // Full navigation, not a router push -- Stripe's page is off-origin.
      window.location.href = response.data.checkout_url;
    } catch {
      setError('Could not start checkout. Please try again.');
      setPendingKey(null);
    }
  };

  const openPortal = async (): Promise<void> => {
    setPendingKey('portal');
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<{ portal_url: string }>(
        `${API_BASE_URL}/api/billing/portal/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      window.location.href = response.data.portal_url;
    } catch {
      setError('Could not open the billing portal. Please try again.');
      setPendingKey(null);
    }
  };

  const subscription = account?.subscription ?? null;
  const hasActivePlan =
    subscription != null && ['active', 'trialing'].includes(subscription.status);

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>Credits & Plans – AI Art Arena</title>
        <meta
          name="description"
          content="Buy credits or subscribe to keep generating AI images on AI Art Arena."
        />
      </Helmet>
      <InPageNavbar pageColor="bg-emerald-500" />
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 text-white md:p-6">
        <h2 className="text-center text-2xl font-bold md:text-4xl">Credits &amp; Plans</h2>
        <p className="mt-2 text-center text-sm text-gray-100 sm:text-base">
          Buy a pack once, or subscribe for a monthly allowance.
        </p>
      </div>

      <div className="space-y-6 bg-stone-50 p-6">
        {error && (
          <div className="rounded-md border-2 border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Balance */}
        {isLoggedIn && (
          <div className="rounded-lg border-2 border-black bg-white p-4">
            {isLoadingAccount ? (
              <p className="text-sm text-gray-500">Loading your balance…</p>
            ) : account ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-gray-700">Your balance</span>
                  <span className="text-3xl font-bold text-emerald-700">
                    {account.credits} {account.credits === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
                {/* The split matters to the user: one bucket expires, the other doesn't. */}
                <p className="mt-2 text-xs text-gray-500">
                  {account.monthly_credits} from your plan (resets each billing period) ·{' '}
                  {account.purchased_credits} purchased (never expire)
                </p>
                {hasActivePlan && subscription && (
                  <p className="mt-2 text-xs text-gray-600">
                    Plan: <span className="font-bold">{subscription.status}</span>
                    {subscription.cancel_at_period_end && ' · cancels at period end'}
                    {subscription.current_period_end &&
                      ` · renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Could not load your balance.</p>
            )}
          </div>
        )}

        {/* Subscription plans */}
        {catalog && catalog.subscription_plans.length > 0 && (
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800">
              <Sparkles size={18} /> Monthly plan
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {catalog.subscription_plans.map((plan: SubscriptionPlan) => (
                <div key={plan.key} className="rounded-lg border-2 border-black bg-white p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">{plan.display_name}</span>
                    <span className="text-xl font-bold">
                      ${plan.price_usd}
                      <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {plan.monthly_credits} credits every {plan.interval}
                  </p>
                  <button
                    onClick={() => void startCheckout(plan.key)}
                    disabled={pendingKey !== null || hasActivePlan}
                    className="mt-3 w-full rounded-md border-2 border-black bg-emerald-500 px-4 py-2 font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {hasActivePlan
                      ? 'Already subscribed'
                      : pendingKey === plan.key
                        ? 'Redirecting…'
                        : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credit packs */}
        {catalog && catalog.credit_packs.length > 0 && (
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-800">
              <CreditCard size={18} /> One-time credit packs
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {catalog.credit_packs.map((pack: CreditPack) => (
                <div key={pack.key} className="rounded-lg border-2 border-black bg-white p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">{pack.display_name}</span>
                    <span className="text-xl font-bold">${pack.price_usd}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {pack.credits} credits · never expire
                  </p>
                  <button
                    onClick={() => void startCheckout(pack.key)}
                    disabled={pendingKey !== null}
                    className="mt-3 w-full rounded-md border-2 border-black bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {pendingKey === pack.key ? 'Redirecting…' : 'Buy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!catalog && !error && <p className="text-sm text-gray-500">Loading pricing…</p>}

        {/* Portal: only meaningful once Stripe knows this customer. */}
        {isLoggedIn && subscription != null && (
          <button
            onClick={() => void openPortal()}
            disabled={pendingKey !== null}
            className="flex items-center gap-2 rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <Settings size={16} />
            {pendingKey === 'portal' ? 'Opening…' : 'Manage subscription'}
          </button>
        )}

        <p className="text-xs text-gray-500">
          Payments are handled by Stripe. We never see or store your card details.
        </p>
      </div>
    </div>
  );
};

export default Billing;
