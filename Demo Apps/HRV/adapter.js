const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");

if (process.argv.length < 5) {
    console.log(`usage: ${process.argv[0]} ${process.argv[1]} <HRV App> <JSON File>`);
    process.exit(1);
}

const entry = process.argv[2];
const json = process.argv[3];
const outDir = process.argv[4];

const file = JSON.parse(fs.readFileSync(json, "utf8"));
const rr = fs.createWriteStream(path.join(outDir, "intervals.rr"));

for (const row of file.data) {
    rr.write(row.Value + "\n");
}
rr.end();

const child = spawn(entry, ["./intervals.rr"]);

child.stderr.on("data", (data) => {
    process.stderr.write(data);
});

child.stdout.on("data", (data) => {
    process.stdout.write(data);
});

child.on("error", (err) => {
    process.stderr.write(err.toString());
});

child.on("close", (code) => {
    process.exit(code);
});
