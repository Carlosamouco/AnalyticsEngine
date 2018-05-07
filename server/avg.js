import * as fs from "fs";

const file = process.argv[2];
const data = fs.readFileSync(file);

const json = JSON.stringify(data);
let add = 0;

for (let i = 0; i < json.length; i++) {
  add += json.
}

console.log("AVG: " + add/json.length);
