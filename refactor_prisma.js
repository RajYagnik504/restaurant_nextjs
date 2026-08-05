const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes("import { prisma } from '@/lib/prisma'")) {
    content = content.replace("import { prisma } from '@/lib/prisma'", "import { getPrisma } from '@/lib/prisma'");
    changed = true;
  }
  
  if (content.includes("prisma.")) {
    // Replace standalone prisma calls (e.g. prisma.user.findUnique)
    // We need to be careful not to replace things like globalForPrisma.prisma
    content = content.replace(/\bprisma\./g, 'getPrisma().');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
