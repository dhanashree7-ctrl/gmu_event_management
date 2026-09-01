const fs = require('fs');
const path = 'c:/Event Management/backend';
fs.readdirSync(path).filter(f => f.endsWith('.php')).forEach(f => {
  const p = path + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes("$auth_payload['USER_NAME']")) {
    c = c.split("$auth_payload['USER_NAME']").join("$auth_payload['username']");
    fs.writeFileSync(p, c);
  }
});
