import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchMe } from './redux/authSlice';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AiPage from './pages/AiPage';
import AnalyticsPage from './pages/AnalyticsPage';
import OrganizationPage from './pages/OrganizationPage';
import HrPage from './pages/HrPage';
import RecruitmentPage from './pages/RecruitmentPage';
import CrmPage from './pages/CrmPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import FinancePage from './pages/FinancePage';
import ProjectsPage from './pages/ProjectsPage';
import DocumentsPage from './pages/DocumentsPage';
import HelpdeskPage from './pages/HelpdeskPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import SecurityPage from './pages/SecurityPage';
import AdminPage from './pages/AdminPage';

function Protected({ children }) {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const token = localStorage.getItem('eps_access');

  useEffect(() => {
    if (token && !user && !loading) dispatch(fetchMe());
  }, [dispatch, token, user, loading]);

  if (token && !user) {
    return <div className="auth-panel"><div className="skeleton" style={{ width: 240, height: 24 }} /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector('.search-btn')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={(
          <Protected>
            <AppLayout />
          </Protected>
        )}
      >
        <Route index element={<DashboardPage />} />
        <Route path="ai" element={<AiPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="hr" element={<HrPage />} />
        <Route path="recruitment" element={<RecruitmentPage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="helpdesk" element={<HelpdeskPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
