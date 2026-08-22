import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import InPageNavbar from './InPageNavbar';

/** Where Stripe returns the user if they back out of Checkout. Nothing was charged. */
const BillingCancel: React.FC = () => (
  <div className="mx-auto w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-xl md:w-3/4">
    <Helmet>
      <title>Checkout cancelled – AI Art Arena</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <InPageNavbar pageColor="bg-emerald-500" />
    <div className="bg-stone-50 p-8">
      <div className="flex flex-col items-center text-center">
        <XCircle className="text-gray-400" size={40} />
        <h2 className="mt-3 text-2xl font-bold text-gray-800">Checkout cancelled</h2>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          You weren&apos;t charged. Your credits are unchanged.
        </p>
      </div>
      <div className="mt-6 flex justify-center">
        <Link
          to="/billing"
          className="rounded-md border-2 border-black bg-emerald-500 px-4 py-2 font-bold text-white hover:bg-emerald-600"
        >
          Back to credits
        </Link>
      </div>
    </div>
  </div>
);

export default BillingCancel;
