import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Plus, Zap } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { LOW_CREDIT_THRESHOLD, SIGNUP_BONUS_CREDITS } from '../constants';
import { BILLING_COPY } from '../billingCopy';

/**
 * Color indicates the balance: emerald means you can generate, amber
 * means you're nearly out, rose means the next click will fail. It saves the user
 * discovering their balance from a 403.
 */
const pillTone = (credits: number): string => {
  if (credits <= 0) return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
  if (credits <= LOW_CREDIT_THRESHOLD) return 'bg-amber-100 text-amber-900 hover:bg-amber-200';
  return 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200';
};

interface AccountNavProps {
  isMobile: boolean;
}

/**
 * The right-hand slot of the in-page navbar: a live credit balance when signed in,
 * a sign-in prompt when not. Both states lead somewhere useful -- the balance opens
 * an account menu with a buy link, the prompt advertises the signup bonus.
 */
const AccountNav: React.FC<AccountNavProps> = ({ isMobile }) => {
  const { account, isLoggedIn, isLoadingAccount, openAuthModal, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close the menu on any click elsewhere, including on the page behind the navbar.
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-end">
        <motion.button
          type="button"
          onClick={() => openAuthModal()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-full border-2 border-black bg-amber-400 px-3 py-1.5 text-sm font-bold text-black transition duration-300 hover:bg-amber-500"
        >
          <LogIn size={isMobile ? 18 : 16} />
          <span>Log in</span>
        </motion.button>
        {!isMobile && (
          <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-gray-500">
            +{SIGNUP_BONUS_CREDITS} free credits
          </span>
        )}
      </div>
    );
  }

  if (isLoadingAccount && !account) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-full border-2 border-gray-200 bg-gray-100" />
    );
  }

  const credits = account?.credits ?? 0;
  const isEmpty = credits <= 0;

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={`${credits} credits — open account menu`}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-black px-3 py-1.5 text-sm font-bold transition duration-300 ${pillTone(credits)}`}
      >
        <Zap size={16} className={isEmpty ? '' : 'fill-current'} />
        {/* Re-keyed on the value so a spend or a top-up visibly ticks over. */}
        <motion.span
          key={credits}
          initial={{ scale: 1.35, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {credits}
        </motion.span>
        {isEmpty && <span className="font-bold">· Top up</span>}
      </motion.button>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-lg border-2 border-black bg-white p-3 shadow-xl"
        >
          {account && (
            <>
              <p className="truncate text-sm font-bold text-gray-800">
                {account.userdisplay_name || account.email}
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {credits} {credits === 1 ? 'credit' : 'credits'}
              </p>
              {/* Same wording as /billing -- both read it from billingCopy. */}
              <p className="mt-1 text-xs text-gray-500">
                {account.monthly_credits} {BILLING_COPY.monthlyBucketLabel} ·{' '}
                {account.purchased_credits} {BILLING_COPY.purchasedBucketLabel}
              </p>
            </>
          )}
          <Link
            to="/billing"
            onClick={() => setIsMenuOpen(false)}
            role="menuitem"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border-2 border-black bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600"
          >
            <Plus size={16} />
            Buy credits
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={16} />
            Log out
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AccountNav;
