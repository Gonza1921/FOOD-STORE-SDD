/**
 * Engram TUI - Entry point
 * Main application component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, MESSAGES } from '@constants/index';

interface AppProps {
  args?: string[];
}

/**
 * Main App component
 * TODO: Replace with actual MainMenu component once implemented
 */
export const App: React.FC<AppProps> = ({ args = [] }) => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box>
        <Text bold color={COLORS.ui.primary}>
          {MESSAGES.navigation.main_menu}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={COLORS.types.architecture}>
          {MESSAGES.navigation.browse_projects}
        </Text>
        <Text color={COLORS.types.decision}>
          {MESSAGES.navigation.search_observations}
        </Text>
        <Text color={COLORS.types.bugfix}>
          {MESSAGES.navigation.view_recent}
        </Text>
        <Text color={COLORS.types.discovery}>
          {MESSAGES.navigation.filter_by_type}
        </Text>
        <Text color={COLORS.types.pattern}>
          {MESSAGES.navigation.statistics}
        </Text>
        <Text color={COLORS.types.config}>
          {MESSAGES.navigation.export_data}
        </Text>
        <Text color={COLORS.types.learning}>
          {MESSAGES.navigation.settings}
        </Text>
      </Box>

      <Box marginTop={2}>
        <Text dimColor>
          Status: Scaffolding ready. Components implementation pending.
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text>
          Press{' '}
          <Text bold>
            Ctrl+C
          </Text>
          {' '}to exit
        </Text>
      </Box>
    </Box>
  );
};

export default App;
