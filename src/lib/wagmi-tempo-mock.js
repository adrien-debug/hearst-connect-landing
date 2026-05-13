// Mock for @wagmi optional modules to fix webpack build issues
// These exports are not used in the browser context

export const tempoWallet = undefined;
export const webAuthn = undefined;
export const accounts = undefined;

// Connector mocks
export const baseAccount = undefined;
export const coinbaseWallet = undefined;
export const metaMask = undefined;
export const porto = undefined;

export default {};
