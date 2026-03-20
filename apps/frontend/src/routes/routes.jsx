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
import Settings from "../pages/Settings.jsx";
import UserProfilePage from "../pages/UserProfilePage.jsx";
import UnauthorizedPage from "../pages/UnauthorizedPage.jsx";
import RequestKYC from "../pages/KYCRequest.jsx";
import Logs from "../pages/Logs.jsx";
import VerifyResetPassword from "../pages/VerifyResetPassword.jsx";

import EmployeeTable from "../components/tabels/EmployeeTable";
import UsersTable from "../components/tabels/UsersTable";
import NoPermissionsPage from "../pages/NoPermissionsPage.jsx";
import ProtectedRoute from "../layouts/ProtectedRoute.jsx";
import CommissionManagement from "../pages/CommissionManagement.jsx";

// services pages and forms
import AddUserProfileKYC from "../components/forms/AddUserProfileKYC.jsx";
import FundRequestPage from "../pages/services/FundRequestPage.jsx";
import FundAddPage from "../pages/services/FundAddPage.jsx";
import PayoutPage from "../pages/services/PayoutPage.jsx";
import Ledger from "../pages/Ledger.jsx";

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
          <Route
            path="commission-management"
            element={<CommissionManagement />}
          />
          <Route path="ledger" element={<Ledger />} />
          <Route path="request-fund" element={<FundRequestPage />} />
          <Route path="payout" element={<PayoutPage />} />
          <Route path="kyc-request" element={<RequestKYC />} />
          <Route path="users" element={<UsersTable />} />
          <Route path="settings" element={<Settings />} />
          <Route path="employee-management" element={<EmployeeTable />} />
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
          path="add-fund"
          element={
            <ProtectedRoute>
              <FundAddPage />
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
      </>,
    ),
  );
};
