import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { TopNavBar } from './components/layout/TopNavBar';
import { SideNavBar } from './components/layout/SideNavBar';
import LandingPage from './pages/LandingPage';
import PublicServicePage from './pages/PublicServicePage';
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import ReportManagementPage from './pages/ReportManagementPage';

// Layout for Public Pages
const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <TopNavBar />
    <Outlet />
  </div>
);

// Layout for Dashboard Pages
const DashboardLayout = () => (
  <div className="min-h-screen flex bg-background">
    <SideNavBar />
    <main className="flex-1 md:ml-[280px] p-6 md:p-8 transition-all">
      <Outlet />
    </main>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/layanan" element={<PublicServicePage />} />
        </Route>

        {/* Login Page (Full Screen) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="reports" element={<ReportManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
