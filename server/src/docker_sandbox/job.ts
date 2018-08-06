import { WriteStream } from "fs";

/**
 * Containers all the information used to execute an application inside a container.
 */
export class Job {
  /**
   * Callback to be called after an application has executed.
   * Contains the container response or an error information if any problem ocorred.
   */
  public callback: (err: any, res?: any) => void;
  /**
   * multipart/form-data request object
   */
  public request: any;
  /**
   * Max. allowed time that the request to the container has to be performed.
   */
  public timeout: number;
  /**
   * File Write Stream that will contain the container's reponse after executing an application.
   */
  public output: WriteStream;

    constructor(output: any, request: any, timeout: number, callback: (err: any, res?: any) => void) {
      this.output = output;
      this.request = request;
      this.callback = callback;
      this.timeout = timeout;
    }
}
