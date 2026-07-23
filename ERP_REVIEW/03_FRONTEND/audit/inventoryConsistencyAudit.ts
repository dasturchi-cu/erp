/**
 * Inventory consistency audit — deprecated after backend integration.
 * FIFO and stock deduction are enforced server-side; this script is a no-op placeholder.
 * Run: npx tsx src/audit/inventoryConsistencyAudit.ts
 */

console.log('\n=== INVENTORY CONSISTENCY AUDIT ===\n');
console.log('SKIP — inventory/FIFO is owned by the backend API.');
console.log('Use backend integration tests or manual E2E against a running server.\n');
process.exit(0);
