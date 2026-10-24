import { StoreProvider, useStore } from './store/useStore';
import SetupWizard from './components/wizard/SetupWizard';
import AppShell from './components/layout/AppShell';

function AppContent() {
  const { state } = useStore();

  if (!state.isSetupComplete) {
    return <SetupWizard />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
