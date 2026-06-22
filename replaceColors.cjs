const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/pages').concat(walk('src/components'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/divide-cyan-100/g, 'divide-primary/20');
  content = content.replace(/divide-cyan-50/g, 'divide-primary/10');
  content = content.replace(/border-t-cyan-600/g, 'border-t-primary');
  content = content.replace(/accent-cyan-500/g, 'accent-primary');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated colors in ' + file);
  }
});
