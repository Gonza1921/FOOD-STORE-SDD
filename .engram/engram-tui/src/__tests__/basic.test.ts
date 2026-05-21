/**
 * Example test - to be expanded
 */

describe('Engram TUI', () => {
  it('should import successfully', () => {
    const types = require('../types');
    expect(types).toBeDefined();
  });

  it('should have colors defined', () => {
    const { COLORS } = require('../constants');
    expect(COLORS.types.architecture).toBeDefined();
    expect(COLORS.ui.primary).toBeDefined();
  });

  it('should have messages defined', () => {
    const { MESSAGES } = require('../constants');
    expect(MESSAGES.navigation.main_menu).toBeDefined();
    expect(MESSAGES.status.loading).toBeDefined();
  });
});
