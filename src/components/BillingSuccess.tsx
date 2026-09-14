import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import InPageNavbar from './InPageNavbar';
import { useAuth } from '../AuthContext';
import { track } from '../analytics';
import type { BillingCatalog, CheckoutStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL as string | undefined;

// Reported once per checkout session: this page polls, and it can be reloaded. The
// status doesn't carry the price, so it's read from the catalog like everywhere else.
const trackPurchase = async (status: CheckoutStatus): Promise<void> => {
  const key = `purchase_tracked:${status.session_id}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  const catalog = await axios
    .get<BillingCatalog>(`${API_BASE_URL}/api/billing/products/`)
    .then((r) => r.data)
    .catch(() => null);
  const product = [...(catalog?.credit_packs ?? []), ...(catalog?.subscription_plans ?? [])].find(
    (p) => p.key === status.product_key
  );
  track('purchase', {
    transaction_id: status.session_id,
    item_id: status.product_key,
    value: product?.price_usd ?? 0,
    currency: 'USD',
  });
};

// Credits are granted by a Stripe webhook, which normally lands within a couple of
// seconds of the redirect but can lag if Stripe is retrying. Poll rather than read
// once, or a user who paid will be shown their old balance and think it failed.
const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30s

const BillingSuccess: React.FC = () => {
  const { refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef<number>(0);

  const poll = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token || !API_BASE_URL || !sessionId) return true;

    try {
      const response = await axios.get<CheckoutStatus>(
        `${API_BASE_URL}/api/billing/checkout-status/`,
        { params: { session_id: sessionId }, headers: { Authorization: `Token ${token}` } }
      );
      setStatus(response.data);
      // `paid`, not `fulfilled`: the sale happened once Stripe has the money.
      if (response.data.paid) void trackPurchase(response.data);
      // Once the webhook has landed, pull the shared account through so the navbar
      // pill shows the topped-up balance without waiting for a navigation.
      if (response.data.fulfilled) void refresh();
      // Stop once we've applied it, or once Stripe says the session will never pay.
      return response.data.fulfilled || response.data.status === 'expired';
    } catch {
      setError('Could not confirm your purchase.');
      return true;
    }
  }, [sessionId, refresh]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async (): Promise<void> => {
      const done = await poll();
      if (cancelled) return;
      attemptsRef.current += 1;
      if (done) return;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId, poll]);

  const renderBody = (): JSX.Element => {
    if (!sessionId) {
      return (
        <Message
          icon={<XCircle className="text-red-500" size={40} />}
          title="Missing checkout session"
          body="We couldn't tell which purchase this was. If you were charged, your credits will still arrive."
        />
      );
    }
    if (error) {
      return (
        <Message
          icon={<XCircle className="text-red-500" size={40} />}
          title="Couldn't confirm your purchase"
          body={`${error} If you were charged, your credits will still be added automatically.`}
        />
      );
    }
    if (status?.fulfilled) {
      return (
        <Message
          icon={<CheckCircle className="text-emerald-500" size={40} />}
          title="You're all set"
          body={
            status.credits_granted != null
              ? `${status.credits_granted} credits added. You now have ${status.account.credits}.`
              : `You now have ${status.account.credits} credits.`
          }
        />
      );
    }
    if (timedOut) {
      // Paid but not yet applied: reassure rather than alarm -- the webhook will
      // still land, and the ledger makes it recoverable either way.
      return (
        <Message
          icon={<Clock className="text-amber-500" size={40} />}
          title="Payment received"
          body="Your credits are taking a moment to arrive. They'll appear shortly — no need to pay again."
        />
      );
    }
    return (
      <Message
        icon={<Clock className="animate-pulse text-emerald-500" size={40} />}
        title={status?.paid ? 'Adding your credits…' : 'Confirming your payment…'}
        body="This usually takes a couple of seconds."
      />
    );
  };

  return (
    <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
      <Helmet>
        <title>Purchase complete – AI Art Arena</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <InPageNavbar pageColor="bg-emerald-500" />
      <div className="bg-stone-50 p-8">
        {renderBody()}
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/premium"
            className="rounded-md border-2 border-black bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-600"
          >
            Start generating
          </Link>
          <Link
            to="/billing"
            className="rounded-md border-2 border-black bg-white px-4 py-2 font-bold text-gray-700 hover:bg-gray-100"
          >
            Back to credits
          </Link>
        </div>
      </div>
    </div>
  );
};

const Message: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="flex flex-col items-center text-center">
    {icon}
    <h2 className="mt-3 text-2xl font-bold text-gray-800">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-gray-600">{body}</p>
  </div>
);

export default BillingSuccess;
