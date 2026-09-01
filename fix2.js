const fs = require('fs');
const path = 'c:/Event Management/backend';
fs.readdirSync(path).filter(f => f.endsWith('.php')).forEach(f => {
  const p = path + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes("$auth_payload['DESIGNATION']")) {
    c = c.split("$auth_payload['DESIGNATION']").join("$auth_payload['designation']");
    fs.writeFileSync(p, c);
  }
});
