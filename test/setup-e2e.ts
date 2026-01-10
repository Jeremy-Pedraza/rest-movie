/**
 * Jest Setup for E2E Tests
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Don't silence console in E2E for debugging
jest.setTimeout(60000);
