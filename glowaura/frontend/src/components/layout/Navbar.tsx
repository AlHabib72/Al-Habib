'use client';

// FIXED: page.tsx imported from '../components/Navbar' but layout uses '../components/layout/Navbar'
// FIXED: Cart badge showed hardcoded '2' — now uses useCart hook
// FIXED: No auth state in navbar — added user menu

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FaSearch, FaShoppingBag, FaUser, FaBars, FaTimes, FaHeart, FaSignOutAlt, FaBoxOpen } from 'react-icons/fa';

const navLinks = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?new=true', label: 'New Arrivals' },
  { href: '/about', label: 'Brand Story' },
  { href: '/blog', label: 'Journal' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Mobile menu btn */}
        <button className="md:hidden text-xl" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl md:text-3xl font-serif font-bold tracking-widest text-[#c4a35a]">
          GlowAura
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex space-x-8 font-medium text-sm uppercase tracking-wide">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#c4a35a] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-4 text-xl">
          <Link href="/shop" aria-label="Search" className="hover:text-[#c4a35a] transition-colors hidden md:block">
            <FaSearch size={16} />
          </Link>

          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-[#c4a35a] transition-colors hidden md:block">
            <FaHeart size={16} />
          </Link>

          <Link href="/cart" className="relative hover:text-[#c4a35a] transition-colors" aria-label="Cart">
            <FaShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#c4a35a] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hover:text-[#c4a35a] transition-colors flex items-center gap-2"
                aria-label="Account"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#c4a35a] flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border border-gray-100 rounded z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/user/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <FaUser size={12} /> Profile
                  </Link>
                  <Link href="/user/orders" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <FaBoxOpen size={12} /> My Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-[#c4a35a]" onClick={() => setUserMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-500 border-t">
                    <FaSignOutAlt size={12} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" aria-label="Login" className="hover:text-[#c4a35a] transition-colors">
              <FaUser size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-sm">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="block px-6 py-3 border-b text-sm font-medium hover:text-[#c4a35a]" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          {!isAuthenticated ? (
            <Link href="/auth/login" className="block px-6 py-3 text-sm font-medium text-[#c4a35a]" onClick={() => setMobileOpen(false)}>
              Login / Register
            </Link>
          ) : (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-6 py-3 text-sm text-red-500">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
