import * as _ from "lodash";
import * as Docker from "dockerode";
import * as uuid from "uuid/v4";

import { default as Container } from "./container";
import { Job } from "./job";

/**
 * Class responsible for managing a pool of containers. Does CRD operations over a set of containers.
 */
export default class PoolManager {
  /**
   * Jobs in queue to be performed when a contianer is available.
   */
  private waitingJobs: Job[];
  /**
   * Containers ready to receive requests.
   */
  private availableContainers: Container[];
  /**
   * Containers in booting process.
   */
  private bootingContainers: Container[];
  /**
   * Containers registered when ready after booting.
   */
  private registeredContainers: string[];
  /**
   * Docker API manager.
   */
  private docker: Docker;
  /**
   * Container booting options.
   */
  private options: any;

  constructor(docker: Docker, options: Docker.ContainerCreateOptions) {
    this.waitingJobs = [];
    this.availableContainers = [];
    this.bootingContainers = [];
    this.registeredContainers = [];
    this.docker = docker;
    this.options = options;
  }

  /**
   * Start a number of containers equals to the size of the pool.
   * @param size Number of containers of the pool.
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

  /**
   * Asynchronously runs a job in the pool.
   * @param job Job to be executed.
   */
  public executeJob(job: Job) {
    if (_.isEmpty(this.availableContainers)) {
      this.waitingJobs.push(job);
    }
    else {
      this._executeJob(job);
    }
  }

  /**
   * Assumes there is at least one container available, and runs
   * the job in it
   * @param job Job to be executed.
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


  /**
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

      const idx = this.registeredContainers.indexOf(container.getIp());
      if (idx !== -1) {
        this._registerContainer(container);
        this.registeredContainers.splice(idx, 1);
      }
    }
    catch (err) {
      if (container && container.cleanup) {
        await container.cleanup(true);
      }
      throw err;
    }

    return container;
  }


  /**
   * Initializes a new container
   */
  private _initializeContainer() {
    return new Promise((resolve, reject) => {
      this.docker.createContainer(this.options, (err, instance) => {
        if (err) return reject(err);
        const container = new Container(instance);
        this.bootingContainers.push(container);
        resolve(container);
      });
    });
  }

  /**
   * Starts the specified container
   * @param container Container to be booted.
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

  /**
   * Retrieves info of a container.
   * @param container Container of where the info will be retrived.
   */
  private _getContainerInfo(container: Container) {
    return container.getNewIp();
  }


  /**
   * Informes that a container is ready to receive requests.
   * The new booted conteiner is then added to the pool.
   * @param ip IP of the new ready container.
   */
  public registerContainer(ip: string) {
    const container: Container = this.bootingContainers.find((c) => {
      return c.getIp() === ip;
    });

    if (container) {
      this._registerContainer(container);
    }
    else {
      this.registeredContainers.push(ip);
    }
  }

  /**
   * Registers a container to the pool.
   * @param container Newly booted container.
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
