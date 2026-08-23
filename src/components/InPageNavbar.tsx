import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  LandPlot,
  Sparkles,
  Image as ImageIcon,
  Grid,
  Info as InfoIcon,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import AccountNav from './AccountNav';
import { useAuth } from '../AuthContext';

interface NavItemProps {
  to?: string;
  icon: React.ComponentType<any>;
  children?: React.ReactNode;
  isActive?: boolean;
  activeColor: string;
  onClick?: () => void;
  isMobile: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  children,
  isActive,
  activeColor,
  onClick,
  isMobile,
}) => {
  const Component: any = to ? Link : 'button';
  const content = (
    <div
      className={`flex items-center space-x-2 px-3 py-2 ${isMobile ? 'w-full text-base' : 'rounded-md text-sm'} font-medium ${isActive ? `${activeColor} text-white` : 'text-gray-700 hover:bg-purple-100'}`}
    >
      <Icon size={isMobile ? 20 : 16} />
      <span>{children}</span>
    </div>
  );

  return isMobile ? (
    <Component to={to} onClick={onClick} className="w-full">
      {content}
    </Component>
  ) : (
    <Component to={to} onClick={onClick} className="mx-1">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        {content}
      </motion.div>
    </Component>
  );
};

interface MobileMenuProps {
  navItems: { to: string; icon: React.ComponentType<any>; text: string }[];
  activeColor: string;
  location: ReturnType<typeof useLocation>;
  onItemClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navItems,
  activeColor,
  location,
  onItemClick,
  isLoggedIn,
  onLogout,
}) => (
  <div className="z-50 bg-white shadow-md">
    {navItems.map((item) => (
      <NavItem
        key={item.to}
        to={item.to}
        icon={item.icon}
        isActive={location.pathname === item.to}
        activeColor={activeColor}
        onClick={onItemClick}
        isMobile
      >
        {item.text}
      </NavItem>
    ))}
    {/* Signing out lives in the drawer on mobile; the balance keeps the header slot. */}
    {isLoggedIn && (
      <NavItem
        icon={LogOut}
        activeColor={activeColor}
        onClick={() => {
          onItemClick();
          onLogout();
        }}
        isMobile
      >
        Log out
      </NavItem>
    )}
  </div>
);

interface InPageNavbarProps {
  pageColor: string;
}

const InPageNavbar: React.FC<InPageNavbarProps> = ({ pageColor }) => {
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { to: '/', icon: HomeIcon, text: 'Home' },
    { to: '/arena', icon: LandPlot, text: 'Arena' },
    { to: '/generate', icon: Sparkles, text: 'Free Generator' },
    { to: '/premium', icon: ImageIcon, text: 'Premium' },
    { to: '/gallery', icon: Grid, text: 'Gallery' },
    { to: '/info', icon: InfoIcon, text: 'Info' },
    { to: '/billing', icon: CreditCard, text: 'Credits' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);

  return (
    <nav className="rounded-t-xl bg-white shadow-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {isMobile ? (
            <>
              <div className="flex items-center">
                <button onClick={toggleMobileMenu} className="mr-2 text-gray-700">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span className="text-xl font-bold">Menu</span>
              </div>
              <AccountNav isMobile />
            </>
          ) : (
            <>
              {/* Mirrors the account slot so the links stay optically centred. */}
              <div className="w-36" />
              <div className="flex flex-grow items-center justify-center space-x-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    isActive={location.pathname === item.to}
                    activeColor={pageColor}
                    isMobile={false}
                  >
                    {item.text}
                  </NavItem>
                ))}
              </div>
              <div className="flex w-36 justify-end">
                <AccountNav isMobile={false} />
              </div>
            </>
          )}
        </div>
      </div>
      {isMobile && isMobileMenuOpen && (
        <MobileMenu
          navItems={navItems}
          activeColor={pageColor}
          location={location}
          onItemClick={() => setIsMobileMenuOpen(false)}
          isLoggedIn={isLoggedIn}
          onLogout={logout}
        />
      )}
    </nav>
  );
};

export default InPageNavbar;
