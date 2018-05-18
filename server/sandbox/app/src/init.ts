import * as http from "http";
import * as child from "child_process";
import * as fs from "fs";
import * as path from "path";

//  import * as console from "./logger";

export function registerWorker() {
  const outDir = path.join(process.cwd(), "temp", "output");
  const outFDir = path.join(outDir, "files");

  fs.mkdir(outDir, (err) => {
    if (err && err.code !== "EEXIST") {
      return process.exit(1);
    }
  });

  fs.mkdir(outFDir, (err) => {
    if (err && err.code !== "EEXIST") {
      return process.exit(1);
    }
  });

  child.exec("/sbin/awk 'END{print $1}' /etc/hosts", (err, stdout, stderr) => {
   child.exec("/sbin/ip route|awk '/default/ { print $3 }'", (err, stdout, stderr) => {
      const options: http.RequestOptions = {
        host: `${stdout.slice(0, -1)}`,
        path: "/register",
        method: "POST",
        port: 3000,
        headers: {
          "Connection": "close",
          "Content-Type": "application/json",
          "Content-Length": 0
        }
      };
      const req = http.request(options);
      req.end(JSON.stringify({"ip":stdout}));
    });
  }); 
}
