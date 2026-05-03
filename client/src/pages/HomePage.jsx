import { useState } from 'react';
import {
  Box, Flex, Text, Avatar, Button, Heading, Badge, Separator,
} from '@radix-ui/themes';
import { logout } from '../api/auth';

export default function HomePage({ auth, onSignOut }) {
  const [signingOut, setSigningOut] = useState(false);
  const { user, account } = auth;

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    onSignOut();
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', padding: '24px' }}
    >
      <Box style={{ width: '100%', maxWidth: '400px' }}>
        <Flex direction="column" gap="2" mb="6">
          <Heading size="8" weight="bold">Reddit Save Logger</Heading>
        </Flex>

        <Flex
          direction="column"
          align="center"
          gap="4"
          p="6"
          style={{
            borderRadius: '16px',
            background: 'var(--color-surface)',
            border: '1px solid var(--gray-a4)',
          }}
        >
          <Avatar
            src={account?.avatar_url}
            fallback={user.reddit_username?.[0]?.toUpperCase() ?? 'U'}
            size="6"
            radius="full"
          />

          <Flex direction="column" align="center" gap="1">
            <Text size="5" weight="bold">u/{user.reddit_username}</Text>
            <Badge color="green" size="1">Connected</Badge>
          </Flex>

          <Separator size="4" />

          <Flex direction="column" gap="1" style={{ width: '100%' }}>
            <Row label="Reddit ID" value={user.reddit_user_id} />
            <Row label="Member since" value={formatDate(user.created_at)} />
          </Flex>
        </Flex>

        <Box mt="4">
          <Button
            variant="soft"
            color="gray"
            size="2"
            loading={signingOut}
            onClick={handleSignOut}
            style={{ width: '100%', cursor: 'pointer' }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Flex>
  );
}

function Row({ label, value, mono }) {
  return (
    <Flex justify="between" align="center" py="1">
      <Text size="2" color="gray">{label}</Text>
      <Text size="2" style={mono ? { fontFamily: 'monospace' } : {}}>{value}</Text>
    </Flex>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
