"use strict";

import * as _ from "lodash";
import * as async from "async";
import * as request from "request";
import * as Docker from "dockerode";
import * as BPromise from "bluebird";

import { Job } from "./job";

//  let fs      = require('fs-extra')
//  let log     = require('winston')

/*
 * A class representing a Docker container.
 *
 * The "instance" field corresponds to a Dockerode container instance
 */
export default class Container {
  private cleanedUp: boolean;
  private ip: string;
  private id: string;

  public vm: Docker.Container;

  constructor(id: string, instance: Docker.Container) {
    this.id = id;
    this.vm = instance;
    this.ip = "";
    this.cleanedUp = false;
  }

  /*
   * Executes a job inside the container
   */
  public executeJob(job: Job) {  
    const options = {
      url: `http://${this.ip}:3000/`,
      formData: job.request,
      timeout: job.timeout
    };
    console.log(process.env.HOST_DIR);
    return new Promise((resolve, reject) => {
      let code: any;
      request
        .post(options)
        .on("response", (response) => {
          code = response.headers["exit-code"];
        })
        .on("error", (err: any) => {
          job.callback(err);
          reject(err);
        })
        .on("end", () => {
          job.callback(null, code);
          resolve();
        })
        .pipe(job.output);
    });
  }

  public getIp() {
    return this.ip;
  }

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

  /*
  * Cleans up the resources used by the container.
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
