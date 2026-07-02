import { Route, Routes, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { StepUpProvider } from './components/stepup/StepUpProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '@/styles/toast.css'
import { queryClient } from '@/lib/queryClient'
import { AppBootstrap } from './components/auth/AppBootstrap'
import NoAccessPage from './pages/no-access/NoAccessPage'
import ServiceUnavailablePage from './pages/service-unavailable/ServiceUnavailablePage'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import RegisterInvitePage from './pages/register/invite/RegisterInvitePage'
import ForgotPasswordPage from './pages/forgot-password'
import ResetPasswordPage from './pages/reset-password'
import MagicLinkPage from './pages/magic-link/MagicLinkPage'
import SetupTenantPage from './pages/setup/tenant'
import SetupAdminPage from './pages/setup/admin'
import RegisterProfilePage from './pages/register/profile'
import VerifyEmailPage from './pages/register/verify-email/VerifyEmailPage'
import LoginSuccessPage from './pages/login-success'
import OAuthAuthorizePage from './pages/oauth/authorize/OAuthAuthorizePage'
import OAuthConsentPage from './pages/oauth/consent/OAuthConsentPage'
import OAuthDevicePage from './pages/oauth/device/OAuthDevicePage'
import OAuthCIBAPage from './pages/oauth/ciba/OAuthCIBAPage'
import OAuthGrantsPage from './pages/oauth/grants/OAuthGrantsPage'
import OAuthEndSessionPage from './pages/oauth/end-session/OAuthEndSessionPage'
import MFAPage from './pages/account/mfa'
import SMSLoginPage from './pages/sms-login/SMSLoginPage'
import LinkedIdentitiesPage from './pages/account/identities/LinkedIdentitiesPage'
import BackupCodeRecoveryPage from './pages/recovery/BackupCodeRecoveryPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StepUpProvider>
      <AppBootstrap>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/no-access" element={<NoAccessPage />} />
        <Route path="/service-unavailable" element={<ServiceUnavailablePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/invite" element={<RegisterInvitePage />} />
        <Route path="/email-verification" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/magic-link" element={<MagicLinkPage />} />
        <Route path="/authorize" element={<OAuthAuthorizePage />} />
        <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
        <Route path="/oauth/consent/:challengeId" element={<OAuthConsentPage />} />
        <Route path="/device" element={<OAuthDevicePage />} />
        <Route path="/oauth/device" element={<OAuthDevicePage />} />
        <Route path="/ciba" element={<OAuthCIBAPage />} />
        <Route path="/oauth/ciba" element={<OAuthCIBAPage />} />
        <Route path="/oauth/grants" element={<OAuthGrantsPage />} />
        <Route path="/oauth/end_session" element={<OAuthEndSessionPage />} />
        <Route path="/oauth/end-session" element={<OAuthEndSessionPage />} />
        <Route path="/setup/tenant" element={<SetupTenantPage />} />
        <Route path="/setup/admin" element={<SetupAdminPage />} />
        <Route path="/register/profile" element={<RegisterProfilePage />} />
        <Route path="/login-success" element={<LoginSuccessPage />} />
        <Route path="/account/mfa" element={<MFAPage />} />
        <Route path="/sms-login" element={<SMSLoginPage />} />
        <Route path="/account/identities" element={<LinkedIdentitiesPage />} />
        <Route path="/recovery" element={<BackupCodeRecoveryPage />} />
      </Routes>
      </AppBootstrap>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </StepUpProvider>
    </QueryClientProvider>
  )
}

export default App
