import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import PublicLayout from "../layouts/PublicLayout";

// 🔹 Public Pages
import Home from "../pages/landing/Home";
import About from "../pages/landing/About";
import Contact from "../pages/landing/Contact";
import Login from "../pages/auth/Login";
import PrivacyPolicy from "../pages/landing/Privacypolicy";
import TermsConditions from "../pages/landing/Terms&conditions";

// 🔹 Protected Pages
import Dashboard from "../pages/Dashboard";
import TransactionHistory from "../pages/TransactionsPage.jsx";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings.jsx";
import CommissionManagement from "../pages/CommissionManagement";
import CardPayout from "../pages/services/CardPayout";
import UserProfilePage from "../pages/UserProfilePage.jsx";
import UnauthorizedPage from "../pages/UnauthorizedPage.jsx";
import RequestKYC from "../pages/RequestKYC.jsx";
import Logs from "../pages/Logs.jsx";
import VerifyResetPassword from "../pages/VerifyResetPassword.jsx";
import AddUserProfileKYC from "../components/forms/AddUserProfileKYC.jsx";

import EmployeeTable from "../components/tabels/EmployeeTable";
import MembersTable from "../components/tabels/MembersTable";
import WalletTable from "../components/tabels/Wallet";
import FundRequestTable from "../components/tabels/FundRequestTable.jsx";
import NoPermissionsPage from "../pages/NoPermissionsPage.jsx";
import ProtectedRoute from "../layouts/ProtectedRoute.jsx";

export const createRouter = () => {
  return createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          {/* Add this route */}
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-conditions" element={<TermsConditions />} />
        </Route>
        {/* ---------------- PROTECTED ROUTES WITH MAIN LAYOUT ---------------- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="commission" element={<CommissionManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="request-fund" element={<FundRequestTable />} />
          <Route path="kyc-request" element={<RequestKYC />} />
          <Route path="members" element={<MembersTable />} />
          <Route path="settings" element={<Settings />} />
          <Route path="employee-management" element={<EmployeeTable />} />
          <Route path="wallet" element={<WalletTable />} />
          <Route path="card-payout" element={<CardPayout />} />
          <Route path="profile/:id" element={<UserProfilePage />} />
          <Route path="logs" element={<Logs />} />

          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
        {/* ---------------- STANDALONE PROTECTED ROUTES ---------------- */}
        <Route
          path="kyc-submit"
          element={
            <ProtectedRoute>
              <AddUserProfileKYC />
            </ProtectedRoute>
          }
        />
        <Route
          path="unauthorized"
          element={
            <ProtectedRoute>
              <UnauthorizedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="permission-denied"
          element={
            <ProtectedRoute>
              <NoPermissionsPage />
            </ProtectedRoute>
          }
        />

        <Route path="verify-reset-password" element={<VerifyResetPassword />} />

        {/* ---------------- 404 / FALLBACK ---------------- */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </>
    )
  );
};
