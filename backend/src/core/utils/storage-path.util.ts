/**
 * Root directory for all persisted files (product images, backups, report
 * exports, update packages, signing keys). Defaults to the working directory
 * (today's behavior) but should be pointed at a mounted Railway Volume via
 * STORAGE_DIR in production — otherwise everything under it is wiped on
 * every redeploy/restart, since Railway's container filesystem is ephemeral.
 */
export function getStorageRoot(): string {
  return process.env.STORAGE_DIR || process.cwd();
}
