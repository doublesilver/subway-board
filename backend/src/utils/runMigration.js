const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runMigration() {
  try {
    console.log('Running database migration...');
    const { stdout, stderr } = await execAsync('node src/db/migrate.js');

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('Migration process completed');
  } catch (error) {
    console.error('Migration execution error:', error.message);
    console.log('Continuing with server start...');
  }
}

module.exports = runMigration;
