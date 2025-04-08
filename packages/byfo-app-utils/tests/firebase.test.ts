import { expect, test } from 'vitest';
import { BYFOFirebaseAdapter } from '../src/firebase';
import { firebaseConfig } from '../../../apps/lit-byfo/firebase.config';
const adapter = new BYFOFirebaseAdapter(firebaseConfig, {}, true);

test('firebase', async () => {
  expect(adapter.connection.db).toBeDefined();
  expect(adapter.connection.rtdb).toBeDefined();
  expect(adapter.connection.storage).toBeDefined();
  expect(adapter.now).toBeGreaterThan(1744093248463);

  // TODO reconsider where firebase sits in this repo.
  // Perhaps the firebase project files should be at the root and simply point to the appropriate project
});
