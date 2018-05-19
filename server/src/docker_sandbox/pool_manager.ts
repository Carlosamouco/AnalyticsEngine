import * as _ from "lodash";
import * as async from "async";
import * as Docker from "dockerode";
import * as uuid from "uuid/v4";

import { default as Container } from "./container";
import { Job } from "./job";

export default class PoolManager {
  private waitingJobs: Job[];
  private availableContainers: Container[];
  private bootingContainers: Container[];
  private docker: Docker;
  private options: any;

  constructor(docker: Docker, options: Docker.ContainerCreateOptions) {
    this.waitingJobs = [];
    this.availableContainers = [];
    this.bootingContainers = [];
    this.docker = docker;
    this.options = options;
  }

  /*
   * Start a number of containers equals to the size of the pool.
   *
   * After creating the containers, the call to the user callback will be
   * intentionally delayed to give the containers the time to initialize and be
   * ready
   */
  public initialize(size: number) {
    if (size <= 0)
      throw Error("invalid pool size");

    const promises: Promise<any>[] = [];

    for (let i = 0; i < size; i++) {
      promises.push(this._createContainer());
    }

    return Promise.all(promises);
  }

  /*
   * Asynchronously runs a job in the pool.
   */
  public executeJob(job: Job) {
    if (_.isEmpty(this.availableContainers)) {
      this.waitingJobs.push(job);
    }
    else {
      this._executeJob(job);
    }
  }

  /*
   * Private method.
   * Assumes there is at least one container available, and runs
   * the job in it
   */
  private async _executeJob(job: Job) {
    if (_.isEmpty(this.availableContainers))
      throw Error("no containers available, but there should have been!");

    const container = this.availableContainers.shift();

    try {
      await container.executeJob(job);
    }
    catch (err) {
      if (err.code !== "ESOCKETTIMEDOUT") {
        console.log(`Container Connection Error: ${err}`);
      }
    }

    container.cleanup(true);
    try {
      this._createContainer();
    }
    catch (err) {
      console.error(`Failed to boot container! Reason: ${err}`);
    }
  }

  /*
   * Cleanups the containers in the pool
   *
   * 1) Empty the list of available containers
   * 2) Clean up every container who was in there
   */
  public cleanup() {
    const containers = this.availableContainers.concat(this.bootingContainers);
    const cleanups: Promise<any>[] = [];

    containers.forEach((c) => {
      cleanups.push(c.cleanup());
    });

    this.availableContainers.length = 0;

    return Promise.all(cleanups);
  }


  /*
   * Private method
   * Initializes a new container and adds it to the pool
   *
   * 1) Create the container
   * 2) Start the container
   * 3) Retrieve various information (such as IP address) from the container
   * 4) Wait until the container is ready
   * 5) Add the container to the pool
   */
  private async _createContainer() {
    let container: Container;
    try {
      container = <Container>await this._initializeContainer();
      await this._startContainer(container);
      await this._getContainerInfo(container);
    }
    catch (err) {
      if (container && container.cleanup) {
        await container.cleanup(true);
      }
      throw err;
    }

    return container;
  }


  /*
   * Private method
   * Initializes a new container
   */
  private _initializeContainer() {
    return new Promise((resolve, reject) => {
      this.docker.createContainer(this.options, (err, instance) => {
        if (err) return reject(err);
        const container = new Container(uuid(), instance);
        this.bootingContainers.push(container);
        resolve(container);
      });
    });
  }

  /*
   * Private method
   * Starts the specified container
   */
  private _startContainer(container: Container) {
    return new Promise((resolve, reject) => {
      container.vm.start((err: any) => {
        if (!err) {
          return resolve();
        }
        reject(err);
      });
    });
  }

  /*
   * Private method
   * Retrieves info of a container
   */
  private _getContainerInfo(container: Container) {
    return container.getNewIp();
  }

  public registerContainer(ip: string) {
    const container: Container = this.bootingContainers.find((c) => {
      return c.getIp() === ip;
    });

    if (container) {
      this._registerContainer(container);
    }
  }

  /*
   * Registers a container to the pool
   */
  private _registerContainer(container: Container) {
    const index = this.bootingContainers.indexOf(container);
    if (index >= 0) {
      this.bootingContainers.splice(index, 1);
    }
    this.availableContainers.push(container);
    if (!_.isEmpty(this.waitingJobs)) {
      const job = this.waitingJobs.shift();
      this._executeJob(job);
    }
  }
}
