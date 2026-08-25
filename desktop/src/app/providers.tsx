import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { AuthBootstrap } from '@/app/AuthBootstrap';
import { CurrencyBootstrap } from '@/app/CurrencyBootstrap';
import { DataBootstrap } from '@/app/DataBootstrap';
import { HeartbeatBootstrap } from '@/app/HeartbeatBootstrap';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <NotificationProvider>
            <AuthBootstrap>
              <CurrencyBootstrap>
                <DataBootstrap>
                  <HeartbeatBootstrap>{children}</HeartbeatBootstrap>
                </DataBootstrap>
              </CurrencyBootstrap>
            </AuthBootstrap>
          </NotificationProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
