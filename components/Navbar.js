'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignedIn } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, ClipboardList, User, Bot, Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, match: (p) => p === '/dashboard' },
    { href: '/visits', label: 'My Visits', icon: ClipboardList, match: (p) => p.startsWith('/visits') },
    { href: '/assistant', label: 'AI Assistant', icon: Bot, match: (p) => p.startsWith('/assistant') },
    { href: '/profile', label: 'Profile', icon: User, match: (p) => p.startsWith('/profile') },
];

export default function Navbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent hidden sm:block">
                            MediLog
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            const active = link.match(pathname);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User menu + Mobile hamburger */}
                    <div className="flex items-center gap-3">
                        <SignedIn>
                            <UserButton afterSignOutUrl="/sign-in" />
                        </SignedIn>

                        <div className="relative md:hidden" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {menuOpen ? (
                                    <X className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-600" />
                                )}
                            </button>

                            {/* Mobile dropdown menu */}
                            {menuOpen && (
                                <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                                    {NAV_LINKS.map((link) => {
                                        const Icon = link.icon;
                                        const active = link.match(pathname);
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={`flex items-center gap-3 py-2.5 px-4 text-sm font-medium transition-colors ${active
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
