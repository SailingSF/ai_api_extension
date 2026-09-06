import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface PrivateToggleProps {
  checked: boolean;
  onChange: (isPrivate: boolean) => void;
}

/**
 * "Keep this out of the public gallery" for the generation forms.
 *
 * Gated on `account.is_premium` -- never on `tier`, which the cancellation webhook
 * overwrites with FREE and which says nothing about an admin grant, so gating on it
 * locks out exactly the users support just granted access to.
 *
 * Shown disabled rather than hidden for everyone else: the server 403s the opt-out
 * either way, and the point of the control being visible is that a free user can see
 * what the subscription buys. Deliberately not sticky across generations -- a
 * remembered "public" the user forgot about is a leak.
 */
const PrivateToggle: React.FC<PrivateToggleProps> = ({ checked, onChange }) => {
  const { account } = useAuth();
  const isPremium = !!account?.is_premium;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        className={`flex items-center gap-2 text-sm font-medium ${isPremium ? 'cursor-pointer text-gray-700' : 'cursor-not-allowed text-gray-400'}`}
      >
        <input
          type="checkbox"
          checked={isPremium && checked}
          disabled={!isPremium}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 accent-purple-600"
        />
        <Lock size={14} className="shrink-0" />
        <span>Keep this private</span>
      </label>
      {isPremium ? (
        <span className="text-xs text-gray-500">Yours only — stays out of the gallery</span>
      ) : (
        <Link
          to="/billing"
          className="rounded border-2 border-black bg-amber-300 px-2 py-0.5 text-xs font-bold text-black transition duration-300 hover:bg-amber-400"
        >
          Premium only — upgrade
        </Link>
      )}
    </div>
  );
};

export default PrivateToggle;
