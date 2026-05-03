import { useEffect, useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { getMe } from './api/auth';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

export default function App() {
  const [auth, setAuth] = useState(null); // null = loading, false = logged out, object = user data
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'error') {
      setAuthError(params.get('message') || 'Authentication failed');
      window.history.replaceState({}, '', '/');
    }

    getMe()
      .then((data) => setAuth(data || false))
      .catch(() => setAuth(false));
  }, []);

  function handleSignedIn(data) {
    setAuth(data);
    setAuthError(null);
  }

  function handleSignedOut() {
    setAuth(false);
  }

  return (
    <Theme appearance="dark" accentColor="orange" radius="medium" scaling="100%">
      {auth === null ? (
        <LoadingScreen />
      ) : auth ? (
        <HomePage auth={auth} onSignOut={handleSignedOut} />
      ) : (
        <LoginPage onSignedIn={handleSignedIn} initialError={authError} />
      )}
    </Theme>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    </div>
  );
}
