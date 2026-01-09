import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BarChart2 } from 'lucide-react';
import '../../styles/globals.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-surface flex flex-col">
            <header className="bg-white border-b border-border shadow-sm">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🦉</span>
                        <span className="font-bold text-lg" style={{ color: '#FEB022' }}>Staffinc Owl</span>
                    </div>
                    <nav className="flex gap-4">
                        <Link to="/upload" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                            <FileText size={18} />
                            Upload
                        </Link>
                        <Link to="/dashboard" className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                            <BarChart2 size={18} />
                            Dashboard
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="container py-8 flex-1">
                {children}
            </main>
        </div>
    );
};

export default Layout;
