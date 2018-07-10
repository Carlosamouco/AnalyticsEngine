const fs = require("fs");
const path = require("path");

if (process.argv.length < 5) {
    console.log(`Usage: ${rocess.argv[0]} ${rocess.argv[1]} <File> <Encoding> <OutDir>`);
}

test(process.argv[2], process.argv[3], process.argv[4]);

function test(filePath, encoding, outDir) {
	if (filePath) {
		fs.readFile(filePath, encoding, (err, data) => {
			if (err) {
				console.error(err);
				return;
			}	
			fs.writeFile(path.join(outDir, "teste.txt"), data, "utf8", (err) => {
				if(err) return console.error(err);
			});  
		});
	}
}
