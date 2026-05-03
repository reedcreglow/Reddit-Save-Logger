import { useState } from 'react';
import { Box, Flex, Text, Button, Callout, Heading } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { initOAuth } from '../api/auth';

export default function LoginPage({ onSignedIn, initialError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const { url } = await initOAuth();
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', padding: '24px' }}
    >
      <Box style={{ width: '100%', maxWidth: '360px' }}>
        <Flex direction="column" gap="2" mb="6">
          <Heading size="8" weight="bold">Reddit Save Logger</Heading>
          <Text color="gray" size="3">Your permanent Reddit library</Text>
        </Flex>

        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon><ExclamationTriangleIcon /></Callout.Icon>
            <Callout.Text>{formatError(error)}</Callout.Text>
          </Callout.Root>
        )}

        <Button
          size="3"
          loading={loading}
          disabled={loading}
          onClick={handleSignIn}
          style={{ width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Sign in with Reddit
        </Button>
      </Box>
    </Flex>
  );
}

function formatError(msg) {
  const map = {
    expired_or_invalid_state: 'Sign-in session expired. Please try again.',
    token_exchange_failed: 'Reddit rejected the request. Check server credentials.',
    me_fetch_failed: 'Could not fetch your Reddit profile. Try again.',
    server_error: 'Server error. Check the console and try again.',
    access_denied: 'Reddit access was denied. Please approve the permissions.',
  };
  return map[msg] || msg;
}
