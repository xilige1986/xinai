const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log('📂 读取 SQLite:', dbPath);

const db = new Database(dbPath, { readonly: true });

const tables = ['Category', 'SubCategory', 'UseCase', 'Tool', 'News', 'SiteSetting', 'QuickLink'];
const data = {};

tables.forEach(table => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    data[table] = rows;
    console.log(`  ✅ ${table}: ${rows.length}`);
  } catch (e) {
    console.log(`  ⚠️ ${table}: ${e.message}`);
    data[table] = [];
  }
});

db.close();

const outputPath = path.join(__dirname, '..', 'sqlite_data_export.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`\n📤 导出完成: ${outputPath}`);
