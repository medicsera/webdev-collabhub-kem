import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { db } from './index.js'
import type * as schema from './schema.js'

export type Db = NodePgDatabase<typeof schema>
export type Tx = NodePgDatabase<typeof schema>

/**
 * Выполнить несколько записей в одной транзакции.
 * При ошибке — rollback, ничего не пишется частично.
 */
export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
        return fn(tx as Tx)
    })
}
