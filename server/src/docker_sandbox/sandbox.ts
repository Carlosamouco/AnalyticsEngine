import * as Container from "./container";
import { default as PoolManager } from "./pool_manager";
import { Job } from "./job";
import * as fs from "fs";
import * as Docker from "dockerode";
import { Response } from "express";
import * as BPromise from "bluebird";

import { SandboxOpts } from "./sandbox.types";

const noop = () => { };

export const default_options: Docker.ContainerCreateOptions = {
  Image: "docker-sandbox",
  NetworkDisabled: false,
  AttachStdin: false,
  AttachStdout: false,
  AttachStderr: false,
  OpenStdin: false,
  User: "sandboxuser",
  Tty: false,
  HostConfig: {
    Memory: 100 * 1000000,
    MemorySwap: -1,
    Privileged: false,
    Binds: [
     /* `/usr/src/app/temp`,*/
      /*`${process.cwd()}/sandbox/app:/usr/src/app`,*/
      `${process.cwd()}/uploads:/usr/src/app/uploads:ro`,
      `${process.env.MATLAB_DIR}:/usr/local/MATLAB:ro`,
    ]
  },
  Labels: {
    __docker_sandbox: "1"
  },
  ExposedPorts: {
    "3000/tcp": {}
  }
};

export class Sandbox {
  private options: SandboxOpts;
  private docker: Docker;
  private manager: PoolManager;
  private static instance: Sandbox;

  private constructor(options: SandboxOpts) {
    options.poolSize = options.poolSize || 1;
    default_options.HostConfig.Memory = (options.memoryLimitMb || 100) * 1000000;

    this.options = options;

    this.docker = new Docker();

    this.manager = new PoolManager(this.docker, default_options);

    const cleanupEvents = ["beforeExit", "SIGINT"];
    const cleanupFn = this.cleanup.bind(this, true);
    cleanupEvents.map(event => {
      process.on(event, cleanupFn);
    });
  }

  public static getInstance(options?: SandboxOpts) {
    if (!this.instance) {
      this.instance = new Sandbox(options);
      this.instance.initialize()
        .catch((err) => {
          console.error(`Unable to initialize the sandbox container swarm:\n\t${err}`);
          process.exit();
        });
    }
    return this.instance;
  }

  /*
   * Initializes the sandbox by creating the pool of
   * containers
   */
  initialize() {
    return this.manager.initialize(this.options.poolSize);
  }

  /*
   * Runs the specifed code
   */
  public run(output: fs.WriteStream, timeout: number, request: any) {
    return new BPromise((resolve, reject) => {
      const job = new Job(output, request, timeout, (err: any, code: any) => {
        if (err) reject(err);
        resolve(code);
      });
      this.manager.executeJob(job);
    });
  }

  public addContainer(ip: string) {
    this.manager.registerContainer(ip);
  }


  /*
   *  Cleanups various resources such as temporary
   *  files and docker containers
   */
  public async cleanup(cb: Function) {
    await this.manager.cleanup();
  }
}
