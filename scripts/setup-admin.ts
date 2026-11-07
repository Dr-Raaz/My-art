/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hashPasswordSync } from '../src/server/auth.js';

/**
 * CLI script to generate scrypt password hashes for Kids Coloring Studio administrators.
 * Usage: npx tsx scripts/setup-admin.ts <username> <password>
 */
function run() {
  const args = process.argv.slice(2);
  const username = args[0] || 'my_art';
  const password = args[1] || 'myart67';

  console.log('==============================================');
  console.log(' Kids Coloring Studio — Admin Hash Provisioner');
  console.log('==============================================');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);

  const hash = hashPasswordSync(password);
  console.log('\nGenerated scrypt Password Hash:');
  console.log(hash);
  console.log('\nTo configure this in your environment or Cloud Run:');
  console.log(`ADMIN_USERNAME="${username}"`);
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log('==============================================');
}

run();
