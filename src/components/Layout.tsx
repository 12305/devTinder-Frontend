import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {!isChatPage && <Navbar />}
      <main className={isChatPage ? '' : 'pt-16'}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;