const fs = require("fs");
const path = require("path");

function test(outDir) {
	console.log("Saving...");
	fs.writeFile(path.join(outDir, "teste.txt"), "Column 1,Column 2,Column 3,Column 4\n1-1,1-2,1-3,1-4\n2-1,2-2,2-3,2-4\n3-1,3-2,3-3,3-4\n4,5,6,7", "utf8", (err) => {
		if(err) return console.error(err);
		console.log("The file was saved!");
	}); 
}

module.exports = test;