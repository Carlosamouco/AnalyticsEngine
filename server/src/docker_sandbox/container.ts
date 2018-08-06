"use strict";

import * as async from "async";
import * as request from "request";
import * as Docker from "dockerode";

import { Job } from "./job";

/**
 * A class representing a Docker container.
 *
 * The "instance" field corresponds to a Dockerode container instance
 */
export default class Container {
  /**
   * Indicates whether the container was deleted or not.
   */
  private cleanedUp: boolean;
  /**
   * Container's IP adress.
   */
  private ip: string;

  /**
   * Docker Container.
   */
  public vm: Docker.Container;

  constructor(instance: Docker.Container) {
    this.vm = instance;
    this.ip = "";
    this.cleanedUp = false;
  }

  /**
   * Executes a job inside the container
   * @param job Job to be executed inside the container.
   * @returns Returnes a Promise when the request to the container as terminated.
   */
  public async executeJob(job: Job) {
    const options = {
      url: `http://${this.ip}:3000/`,
      formData: job.request,
      timeout: job.timeout
    };

    return new Promise((resolve, reject) => {
      let code: any;
      const stream = request
        .post(options)
        .on("response", (response) => {
          code = response.headers["exit-code"];
        })
        .on("error", (err: any) => {
          job.callback(err);
          reject(err);
        })
        .pipe(job.output);

      stream.on("close", () => {
        job.callback(null, code);
        resolve();
      });

      stream.on("error", (err: any) => {
        job.callback(err);
        resolve();
      });
    });
  }

  public getIp() {
    return this.ip;
  }

  /**
   * Gets the container's IP adress.
   */
  public getNewIp() {
    return new Promise((resolve, reject) => {
      this.vm.inspect((err: any, data: any) => {
        if (err || !data || !data.NetworkSettings || !data.NetworkSettings.IPAddress
          || data.NetworkSettings.IPAddress.length == 0) {
          return reject(err || Error("unable to retrieve container IP"));
        }
        this.ip = data.NetworkSettings.IPAddress;
        resolve();
      });
    });
  }

  /**
   * Cleans up the resources used by the container.
   * @param ignore Igores an error callback.
   */
  public cleanup(ignore: boolean = false) {
    if (this.cleanedUp === true) {
      return new Promise((resolve) => {
        resolve();
      });
    }

    const stages = [
      this.vm.stop.bind(this.vm),
      this.vm.remove.bind(this.vm, { force: true }),
      (next: any) => {
        this.cleanedUp = true;
        async.nextTick(next);
      }
    ];
    return new Promise((resolve, reject) => {
      async.series(stages, (err) => {
        if (err && !ignore) return reject(err);
        resolve();
      });
    });
  }
}
