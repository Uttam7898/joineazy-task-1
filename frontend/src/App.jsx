import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentHome from "./pages/student/Home.jsx";
import StudentGroup from "./pages/student/Group.jsx";
import StudentAssignments from "./pages/student/Assignments.jsx";
import AssignmentDetail from "./pages/student/AssignmentDetail.jsx";
import AdminHome from "./pages/admin/Home.jsx";
import AdminAssignments from "./pages/admin/Assignments.jsx";
import AssignmentForm from "./pages/admin/AssignmentForm.jsx";
import AdminTracking from "./pages/admin/Tracking.jsx";

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app"} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <Guard role="student">
            <Layout />
          </Guard>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="group" element={<StudentGroup />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:id" element={<AssignmentDetail />} />
      </Route>
      <Route
        path="/admin"
        element={
          <Guard role="admin">
            <Layout />
          </Guard>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="assignments/new" element={<AssignmentForm />} />
        <Route path="assignments/:id/edit" element={<AssignmentForm />} />
        <Route path="tracking" element={<AdminTracking />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
