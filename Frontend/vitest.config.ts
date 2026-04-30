import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Provide a mock for @microsoft/signalr during tests so imports resolve
      '@microsoft/signalr': path.resolve(__dirname, 'src/__mocks__/signalrMock.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
})
