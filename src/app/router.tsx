import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { GroupDashboardPage } from '@/features/groups/GroupDashboardPage'
import { GroupHomePage } from '@/features/groups/GroupHomePage'
import { RequireGroupMembership } from '@/features/groups/RequireGroupMembership'
import { GroupSettingsPage } from '@/features/invites/GroupSettingsPage'
import { InviteCodePage } from '@/features/invites/InviteCodePage'
import { InvitePage } from '@/features/invites/InvitePage'
import { TitleDetailPage } from '@/features/watchlist/TitleDetailPage'
import { WatchlistPage } from '@/features/watchlist/WatchlistPage'
import { AppShell } from '@/layouts/AppShell'
import { PublicLayout } from '@/layouts/PublicLayout'
import { LandingPage } from '@/pages/LandingPage'
import { AboutPage } from '@/pages/AboutPage'
import { MembersPage } from '@/features/members/MembersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="invite" element={<InviteCodePage />} />
        <Route path="invite/:token" element={<InvitePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="app" element={<GroupHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="groups/:groupId" element={<RequireGroupMembership />}>
            <Route index element={<GroupDashboardPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="titles/:titleId" element={<TitleDetailPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="settings" element={<GroupSettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
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
