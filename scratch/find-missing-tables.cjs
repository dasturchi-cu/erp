const fs = require('fs');
const path = require('path');

const migDir = path.resolve('backend/prisma/migrations');
const files = fs.readdirSync(migDir).filter(f => fs.statSync(path.join(migDir, f)).isDirectory());
const allSql = files.map(f => fs.readFileSync(path.join(migDir, f, 'migration.sql'), 'utf8')).join('\n');

const schema = fs.readFileSync(path.resolve('backend/prisma/schema.prisma'), 'utf8');
const tables = [...schema.matchAll(/@@map\("([^"]+)"\)/g)].map(m => m[1]);

const missing = tables.filter(t => !allSql.includes(`"${t}"`));
console.log('Missing tables in migrations:', missing);
