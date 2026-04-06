try {
  require('./dist/main');
} catch (error) {
  console.error('BulkCart backend failed to start. Build the Nest app first with "npm run build".');
  console.error(error);
  process.exit(1);
}
