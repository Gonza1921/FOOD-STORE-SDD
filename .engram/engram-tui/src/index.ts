/**
 * Engram TUI - Main entry point
 */

import React from 'react';
import { render } from 'ink';
import App from './App';

/**
 * Parse command line arguments
 */
function parseArgs(): { command?: string; args: string[] } {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return { command: 'menu', args: [] };
  }

  return {
    command: args[0],
    args: args.slice(1),
  };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const { command, args } = parseArgs();

    // Render main app
    const { unmount, waitUntilExit } = render(
      <App args={[command, ...args]} />
    );

    // Wait for exit
    await waitUntilExit();
    unmount();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
