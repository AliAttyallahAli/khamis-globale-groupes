// frontend/src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import GerantDashboard from '../components/dashboard/GerantDashboard';
import AgentDashboard from '../components/dashboard/AgentDashboard';
import UserDashboard from '../components/dashboard/UserDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'gerant':
      return <GerantDashboard />;
    case 'agent':
      return <AgentDashboard />;
    default:
      return <UserDashboard />;
  }
}