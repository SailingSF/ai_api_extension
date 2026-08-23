import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LandPlot,
  Sparkles,
  Image as ImageIcon,
  Grid,
  LogIn,
  Info as InfoIcon,
  Zap,
  CreditCard,
} from 'lucide-react';
import axios from 'axios';
import ImageModal from './ImageModal';
import { useAuth } from '../AuthContext';
import { LOW_CREDIT_THRESHOLD, SIGNUP_BONUS_CREDITS } from '../constants';
import type { ImageItem } from '../types';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ComponentType<any>;
  to?: string;
  primary?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
  icon: Icon,
  to,
  primary,
}) => {
  const baseStyles =
    'w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-semibold transition-colors duration-300';
  const primaryStyles = primary
    ? 'bg-amber-400 text-black hover:bg-amber-500 ring-4 ring-yellow-400 ring-opacity-50'
    : className || '';

  const buttonContent = (
    <>
      {Icon && <Icon size={24} />}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link to={to} className={`${baseStyles} ${primaryStyles}`}>
          {buttonContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`${baseStyles} ${primaryStyles}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {buttonContent}
    </motion.button>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-md"
  >
    <Icon size={32} className="mb-4 text-amber-500" />
    <h3 className="mb-2 text-lg font-bold">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);

const Home: React.FC = () => {
  const { account, isLoggedIn, openAuthModal } = useAuth();
  const [topImage, setTopImage] = useState<ImageItem | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchTopImage = async (): Promise<void> => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/top-image/`);
        setTopImage(response.data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching top image:', error);
      }
    };

    fetchTopImage();
  }, []);

  const credits = account?.credits ?? 0;
  const isLow = account != null && credits <= LOW_CREDIT_THRESHOLD;

  return (
    <div className="mx-auto w-full rounded-xl border-4 border-black bg-white p-6 shadow-xl md:w-3/4">
      <Helmet>
        <title>AI Art Arena – Compare Models, Generate Images, Gallery</title>
        <meta
          name="description"
          content="Compare AI image models in The Arena, generate free or premium AI images, and explore the community gallery."
        />
        <link rel="canonical" href="https://yourdomain.com/" />
        <meta property="og:title" content="AI Art Arena" />
        <meta property="og:description" content="Compare AI models and create stunning AI art." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">🏟️ Welcome to the Arena 🏟️</h1>
        <p className="mb-6 text-xl text-gray-700">
          Your creative playground for AI image generation - compare models, create stunning images,
          and join our community
        </p>
      </motion.div>

      {topImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto mb-8 max-w-2xl"
        >
          <h2 className="mb-4 text-center text-2xl font-bold">🏆 Top Generation 🏆</h2>
          <div className="group relative mx-auto w-fit">
            <img
              src={topImage.url}
              alt={topImage.generation_log.prompt}
              loading="lazy"
              width={512}
              height={512}
              className="h-64 cursor-pointer rounded-lg object-contain shadow-xl transition duration-300 group-hover:opacity-90"
              onClick={() => setShowImageModal(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
              <button
                className="rounded-lg bg-black bg-opacity-50 px-4 py-2 text-white"
                onClick={() => setShowImageModal(true)}
              >
                View Details
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showImageModal && topImage && (
        <ImageModal
          image={topImage}
          onClose={() => setShowImageModal(false)}
          customButton={
            <Link
              to="/gallery"
              className="rounded bg-green-500 px-4 py-2 text-white transition duration-300 hover:bg-green-600"
            >
              View in Gallery
            </Link>
          }
        />
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          title="Compare Models"
          description="Test different AI models side by side in the Arena"
          icon={LandPlot}
        />
        <FeatureCard
          title="Generate Images"
          description="Create AI art with free and premium models"
          icon={Sparkles}
        />
        <FeatureCard
          title="Community Gallery"
          description="Share creations and get inspired by others"
          icon={Grid}
        />
      </div>

      <div className="space-y-6 px-2 py-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="mb-2 text-center font-medium">Compare AI image models</p>
          <Button
            to="/arena"
            className="bg-amber-400 text-black ring-4 ring-yellow-400 ring-opacity-50 hover:bg-amber-500"
            icon={LandPlot}
            primary
          >
            THE ARENA
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="mb-2 text-center font-medium">Generate Free AI images with HuggingFace</p>
          <Button
            to="/generate"
            className="bg-blue-500 text-white hover:bg-blue-600"
            icon={Sparkles}
          >
            Free Image Generator
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="mb-2 text-center font-medium">
            Access premium AI models faster and with assisted prompting
          </p>
          <Button
            to="/premium"
            className="bg-purple-500 text-white hover:bg-purple-600"
            icon={ImageIcon}
          >
            <em>PREMIUM</em> Image Generator
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <p className="mb-2 text-center font-medium">
            Browse and upvote images, compare models and prompts
          </p>
          <Button to="/gallery" className="bg-green-500 text-white hover:bg-green-600" icon={Grid}>
            Gallery
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6"
      >
        {/* This panel used to offer Login and Logout side by side to everyone. It now
            says the thing that's actually useful for the state you're in: what you get
            by signing up, or what you have left to spend. */}
        {isLoggedIn ? (
          <>
            <h3 className="mb-4 text-center text-xl font-bold">
              {isLow ? "You're running low" : 'Ready when you are'}
            </h3>
            <div className="mb-4 flex items-center justify-center gap-2">
              {account == null ? (
                // Signed in but /api/me/ hasn't answered yet -- don't flash a zero at
                // someone who has credits.
                <span className="h-8 w-24 animate-pulse rounded bg-amber-200" />
              ) : (
                <>
                  <Zap className="fill-current text-amber-500" size={24} />
                  <span className="text-3xl font-bold text-gray-800">{credits}</span>
                  <span className="text-gray-700">{credits === 1 ? 'credit' : 'credits'}</span>
                </>
              )}
            </div>
            <p className="mb-4 text-center text-gray-700">
              {isLow
                ? 'Top up to keep comparing models and running premium generations.'
                : 'Spend them in The Arena or on a premium model.'}
            </p>
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              <Button
                to="/billing"
                className="flex-1 bg-amber-400 text-black ring-4 ring-yellow-400 ring-opacity-50 hover:bg-amber-500"
                icon={CreditCard}
                primary
              >
                Buy Credits
              </Button>
              <Button
                to="/premium"
                className="flex-1 bg-purple-500 text-white hover:bg-purple-600"
                icon={ImageIcon}
              >
                Generate Something
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="mb-2 text-center text-xl font-bold">Unlock Premium Features</h3>
            <p className="mb-4 text-center font-medium text-amber-800">
              New accounts start with {SIGNUP_BONUS_CREDITS} free credits.
            </p>
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-amber-500" size={20} />
                <p className="text-gray-700">Access faster premium AI models</p>
              </div>
              <div className="flex items-center space-x-2">
                <LandPlot className="text-amber-500" size={20} />
                <p className="text-gray-700">Compare models side-by-side in The Arena</p>
              </div>
              <div className="flex items-center space-x-2">
                <Grid className="text-amber-500" size={20} />
                <p className="text-gray-700">Upvote your favorite generations</p>
              </div>
            </div>

            <Button
              onClick={() => openAuthModal()}
              className="bg-amber-400 text-black ring-4 ring-yellow-400 ring-opacity-50 hover:bg-amber-500"
              icon={LogIn}
              primary
            >
              Get {SIGNUP_BONUS_CREDITS} Free Credits
            </Button>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <h3 className="mb-4 text-center text-xl font-bold">What is this?</h3>
        <div>
          <Button to="/info" className="bg-gray-500 text-white hover:bg-gray-600" icon={InfoIcon}>
            Information
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
