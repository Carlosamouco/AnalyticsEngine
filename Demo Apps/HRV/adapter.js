const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");

if (process.argv.length < 10) {
    console.log(`usage: ${process.argv[0]} ${process.argv[1]} <HRV App> <outputDir> <HRV File> <Overlap> <Window Time> <Age> <HR Rest> <Time>`);
    process.exit(1);
}

const entry = process.argv[2];
const outDir = process.argv[3];
const json = process.argv[4];
const overlap = process.argv[5];
const window = process.argv[6];
const age = process.argv[7];
const hrRest = process.argv[8];
const time = process.argv[9];

const file = JSON.parse(fs.readFileSync(json, "utf8"));
const rr = fs.createWriteStream(path.join(outDir, "intervals.rr"));

for (const row of file.data) {
    rr.write(row.Value + "\n");
}
rr.end();

// ./main <rrFile> <overlap> <windowT> <age> <hrRest> <time>
const child = spawn(entry, [path.join(outDir, "intervals.rr"), overlap, window, age, hrRest, time]);

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
