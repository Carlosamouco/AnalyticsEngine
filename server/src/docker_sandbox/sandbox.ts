import { default as PoolManager } from "./pool_manager";
import { Job } from "./job";
import * as fs from "fs";
import * as Docker from "dockerode";

import { SandboxOpts } from "./sandbox.types";

/**
 * Container configurations set when booting a new container.
 */
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
    Memory: 250 * 1000000,
    MemorySwap: -1,
    Privileged: false,
    Binds: [
      `matlab:/usr/local/MATLAB:ro`
    ]
  },
  Labels: {
    __docker_sandbox: "1"
  },
  ExposedPorts: {
    "3000/tcp": {}
  }
};


/**
 * Sandbox module that ofeers an abstraction to the containers management and allows to executed applications remotly on them.
 */
export class Sandbox {
  private options: SandboxOpts;
  private docker: Docker;
  private manager: PoolManager;
  private static instance: Sandbox;

  /**
   * Creates a new Instance of the Sandbox class - Singleton.
   * @param options Indicates the size of the containers pool. Default 1.
   */
  private constructor(options: SandboxOpts) {
    options.poolSize = options.poolSize || 1;

    this.options = options;
    this.docker = new Docker();
    this.manager = new PoolManager(this.docker, default_options);

    const cleanupEvents = ["beforeExit", "SIGINT"];
    const cleanupFn = this.cleanup.bind(this, true);
    cleanupEvents.map(event => {
      process.on(event, cleanupFn);
    });
  }

  /**
   * Creates a new instance of the Sandbox class or returns a existing one.
   * @param options Indicates the size of the containers pool. (Optional)
   */
  public static getInstance(options?: SandboxOpts) {
    if (!this.instance) {
      this.instance = new Sandbox(options);
      console.time("Sandbox Initialized");
      this.instance.initialize()
        .then(() => {
          console.timeEnd("Sandbox Initialized");
        })
        .catch((err) => {
          console.error(`Unable to initialize the sandbox container swarm:\n\t${err}`);
          process.exit();
        });
    }
    return this.instance;
  }

  /**
   * Initializes the sandbox by creating the pool of containers.
   */
  initialize() {
    return this.manager.initialize(this.options.poolSize);
  }

 /**
  * Runs an application inside a container.
  * @param output File Write Stream where the container's response with the output data of the application to be executed is saved (.zip format).
  * @param timeout Max. allowed time that the request to a container has to be performed.
  * @param request multipart/form-data request to be sent to a container. Contains the application files and the input data.
  * @returns A Promise Object resolved when the output data of an application being executed in the container is saved.
  */
  public run(output: fs.WriteStream, timeout: number, request: any) {
    return new Promise((resolve, reject) => {
      const job = new Job(output, request, timeout, (err: any, code: any) => {
        if (err) reject(err);
        resolve(code);
      });
      this.manager.executeJob(job);
    });
  }

  /**
   * Registers a new booted container in the pool manager.
   * @param ip Adress of the remote container.
   */
  public addContainer(ip: string) {
    this.manager.registerContainer(ip);
  }


  /*
   *  Cleanups various resources such as temporary
   *  files and docker containers
   */
  public async cleanup() {
    await this.manager.cleanup();
  }
}
