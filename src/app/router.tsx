import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LandingPage } from '@/pages/LandingPage'
import {
  AboutPage,
  AppHomePage,
  GroupDashboardPage,
  InvitePage,
  MembersPage,
  SettingsPage,
  TitleDetailPage,
  WatchlistPage,
} from '@/pages/PlaceholderPages'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="invite/:token" element={<InvitePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="app" element={<AppHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="groups/:groupId" element={<GroupDashboardPage />} />
          <Route path="groups/:groupId/watchlist" element={<WatchlistPage />} />
          <Route
            path="groups/:groupId/titles/:titleId"
            element={<TitleDetailPage />}
          />
          <Route path="groups/:groupId/members" element={<MembersPage />} />
          <Route path="groups/:groupId/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster theme="dark" position="bottom-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
