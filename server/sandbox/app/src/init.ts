import * as http from "http";
import * as child from "child_process";
import * as fs from "fs";
import * as path from "path";

//  import * as console from "./logger";

export function registerWorker() {
  const outDir = path.join(process.cwd(), "temp", "output", "files");

  try {
    mkdirsSync(outDir);
  }
  catch(err) {
    if (err.code !== "EEXIST") {
      return process.exit(1);
    }
  }  

  child.exec("awk 'END{print $1}' /etc/hosts", (err, stdout, stderr) => {
   const postData = JSON.stringify({ip:stdout});

    child.exec("/sbin/ip route|awk '/default/ { print $3 }'", (err, stdout, stderr) => {
      const options: http.RequestOptions = {
        host: `${stdout.slice(0, -1)}`,
        path: "/register",
        method: "POST",
        port: 3000,
        headers: {
          "Connection": "close",
          "Content-Type": "application/json",
          "Content-Length": postData.length
        }
      };
      const req = http.request(options);
      req.write(postData);
      req.end();
    });
  });
}

function mkdirsSync(pathToCreate: string) {
  pathToCreate
    .split(path.sep)
    .reduce((currentPath, folder) => {
      currentPath += folder + path.sep;

      try {
        fs.mkdirSync(currentPath);
      }
      catch (err) {
        if (err.code !== "EEXIST") {
          throw err;
        }
      }

      return currentPath;
    }, "");
}