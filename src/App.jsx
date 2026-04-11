import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import TrackApplication from "./pages/TrackApplication";
import Certificate from "./pages/Certificate";
import Product from "./pages/Product";
import Profile from "./pages/Profile";
import Invoice from "./pages/Invoice";
import VerifyAccount from "./pages/VerifyAccount";
import AuthProvider from "./contexts/AuthProvider";
import ProductProvider from "./contexts/ProductProvider";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { Toaster } from "sonner";
import Audit from "./pages/Audit";
import Message from "./pages/Message";
import { SocketProvider } from "./contexts/SocketContext";
import ManageUsers from "./pages/ManageUsers";
import SubmitDocuments from "./pages/SubmitDocuments";
import ResetPassword from "./pages/ResetPassword";
import UserGuide from "./pages/UserGuide";
import PublicGuide from "./pages/PublicGuide";

function App() {
  return (
    <Router>
      <SocketProvider>
      <AuthProvider>
        <ProductProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/public-guide" element={<PublicGuide />} />
            <Route path="/verify/:token" element={<VerifyAccount />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id/track" element={<TrackApplication />} />
              <Route path="/certificates" element={<Certificate />} />
              <Route path="/products" element={<Product />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/invoices" element={<Invoice />} />
              <Route path="/message" element={<Message />} />
              <Route path="/audits" element={<Audit />} />
              <Route path="/submit-documents" element={<SubmitDocuments />} />
              <Route path="/manage-users" element={<ManageUsers />} />
              <Route path="/user-guide" element={<UserGuide />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ProductProvider>
      </AuthProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;
