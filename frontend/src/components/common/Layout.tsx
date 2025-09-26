import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="mx-auto flex w-full max-w-screen-2xl gap-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="w-64 shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1">
          <div className="min-h-[calc(100vh-8rem)] rounded-3xl bg-white/95 px-6 py-6 shadow-sm ring-1 ring-gray-100 xl:px-8 xl:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;