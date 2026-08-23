import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Zap } from 'lucide-react';

type NoticeTone = 'error' | 'credits';

interface CreditNoticeProps {
  tone: NoticeTone;
  children: React.ReactNode;
  /** Show the top-up call to action. Only meaningful for the credits tone. */
  showBuyLink?: boolean;
}

const TONES: Record<NoticeTone, { wrapper: string; icon: JSX.Element }> = {
  error: {
    wrapper: 'border-red-500 bg-red-50 text-red-800',
    icon: <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />,
  },
  credits: {
    wrapper: 'border-amber-500 bg-amber-50 text-amber-900',
    icon: <Zap size={18} className="mt-0.5 shrink-0 fill-current text-amber-600" />,
  },
};

/**
 * In-page feedback for a generator.
 *
 * Running out of credits used to be reported by opening the *login* modal with the
 * explanation pasted on top of it, which asked an already-signed-in user to sign in
 * again and offered no way to buy anything. Failures belong next to the button that
 * failed, with the fix attached.
 */
const CreditNotice: React.FC<CreditNoticeProps> = ({ tone, children, showBuyLink }) => {
  const { wrapper, icon } = TONES[tone];

  return (
    <div className={`flex flex-wrap items-start gap-3 rounded-md border-2 p-3 text-sm ${wrapper}`}>
      {icon}
      <p className="min-w-0 flex-1 font-medium">{children}</p>
      {showBuyLink && (
        <Link
          to="/billing"
          className="shrink-0 rounded-md border-2 border-black bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition duration-300 hover:bg-emerald-600"
        >
          Buy credits
        </Link>
      )}
    </div>
  );
};

export default CreditNotice;
