import { Prisma } from '@prisma/client';

/** Row-level lock for customer debt mutations within an open transaction. */
export async function lockCustomerForDebtUpdate(
  tx: Prisma.TransactionClient,
  companyId: string,
  customerId: string,
): Promise<void> {
  await tx.$executeRaw`
    SELECT id FROM customers
    WHERE id = ${customerId}::uuid AND company_id = ${companyId}::uuid AND deleted_at IS NULL
    FOR UPDATE
  `;
}
