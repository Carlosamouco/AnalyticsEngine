import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { ApplicationDetails } from '../app-details/app-details.types';
import { AddFilesModalComponent } from './add-files-modal/add-files-modal.component';
import { isObject } from 'util';

enum ParamTypes {
  Primitive = '0',
  File = '1'
}

enum OutputModes {
  Raw = '0',
  Parsed = '1'
}

enum HTTPMethods {
  GET = '0',
  POST = '1'
}


@Component({
  selector: 'app-invoke-app',
  templateUrl: './invoke-app.component.html',
  styleUrls: ['./invoke-app.component.css']
})
export class InvokeAppComponent implements OnInit {

  public app: ApplicationDetails;
  public processingResult: any;

  public timeout: number;
  public secure: boolean;

  public outputMode: { key: string, value: string };
  public outputModes: any;
  public activeIndex: number;

  public onInvoke: boolean;

  public showResults: boolean;
  public hideResults: boolean;

  public hideMainContainer: boolean;
  public hideSecundaryContainer: boolean;

  public addFileModalRef: BsModalRef;

  public requestDataError: any[];

  private animationEnded: boolean;

  constructor(private route: ActivatedRoute, private router: Router, private modalService: BsModalService, private http: HttpClient) {
    const data = route.snapshot.data['apps'];
    this.app = data;
    this._initParamVals();
    if (!this.app) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }
    this.timeout = 5000;
    this.secure = false;

    this.activeIndex = 0;
    this.outputMode = {
      key: Object.keys(OutputModes)[this.activeIndex],
      value: OutputModes[Object.keys(OutputModes)[this.activeIndex]]
    };
    this.outputModes = this.getObjProperties(OutputModes);

    this.onInvoke = false;
    this.showResults = false;
    this.hideSecundaryContainer = true;
    this.hideMainContainer = false;
    this.hideResults = false;

    this.animationEnded = true;
  }

  private _initParamVals() {
    for (const param of this.app.algorithm.parameters) {
      if (param.type === ParamTypes.File) {
        (<any>param).value = {};
      }
      if (param.options.default && !param.options.static) {
        (<any>param).useDefault = true;
        this.setDefault(param);
      }
    }
  }

  ngOnInit() {
  }

  public isFileRef(key) {
    const file = this.app.algorithm.output.files.find((elem) => {
      return elem.alias === key;
    });
    return !!file;
  }

  public isArray(obj: any) {
    return obj instanceof Array;
  }

  public showObject(data: any) {
    if (isObject(data)) {
      return JSON.stringify(data, null, '\t');
    }
    return data;
  }

  public getObjProperties(obj: any) {
    return Object.keys(obj).map((key) => {
      return {
        key: key,
        value: obj[key]
      };
    });
  }

  public setDefault(param) {
    if (param.useDefault) {
      if (param.type === ParamTypes.Primitive) {
        param.value = param.options.default;
      } else if (param.type === ParamTypes.File) {
        param.value = {
          name: param.options.default
        };
      }
    } else {
      if (param.type === ParamTypes.Primitive) {
        param.value = '';
      } else if (param.type === ParamTypes.File) {
        param.value = {};
      }
    }
  }

  public hideResultsContainer(animation) {
    if (animation === 'moveFromRightFade') {
      this.hideMainContainer = true;
      this.showResults = false;

      this.animationEnded = true;
    }
    if (animation === 'moveFromLeftFade') {
      this.requestDataError = null;
      this.processingResult = null;

      this.hideSecundaryContainer = true;
      this.hideResults = false;

      this.animationEnded = true;
    }
  }

  public onNewRun() {
    this.hideMainContainer = false;
    this.hideResults = true;

    if (!this.animationEnded) {
      this.showResults = false;
    }

    this.animationEnded = false;
  }

  public validateForm() {
    if (this.onInvoke) {
      return true;
    }

    for (const param of this.app.algorithm.parameters) {
      if (param.options.static) {
        continue;
      }
      
      if (param.options.required && !((<any>param).useDefault || (<any>param).useEndpoint)) {
        if (param.type === ParamTypes.Primitive && !(<any>param).value) {
          return true;
        } else if (param.type === ParamTypes.File && !(<any>param).value.file) {
          return true;
        }
      }
    }

    return false;
  }

  public invokeApp() {
    const args = {};
    const promises: Promise<{}>[] = [];
    this.requestDataError = [];

    this.hideSecundaryContainer = false;
    this.showResults = true;
    this.onInvoke = true;

    if (!this.animationEnded) {
      this.hideResults = false;
    }

    this.animationEnded = false;

    for (const param of this.app.algorithm.parameters) {
      if ((<any>param).useEndpoint) {
        const params = {};

        for (const endParam of param.options.endpoint.parameters) {
          if ((<any>endParam).value) {
            params[endParam.name] = (<any>endParam).value;
          }
        }

        let url = param.options.endpoint.url;

        if (!(url.startsWith('http://') || url.startsWith('https://'))) {
          url = 'http://' + url;
        }

        promises.push(new Promise(
          (resolve, reject) => {
            let request;
            if (param.options.endpoint.method === HTTPMethods.GET) {
              request = this.http.get(url, {
                params
              });
            } else {
              request = this.http.post(url, params);
            }
            request.subscribe((data) => {
              if (param.type === ParamTypes.File) {
                args[param.name] = { data };
              } else {
                args[param.name] = data;
              }
              resolve();
            }, (err) => {
              reject(err);
            });
          }));

      } else if ((<any>param).useDefault) {
        if (!param.options.required) {
          args[param.name] = null;
        }
      } else if ((<any>param).value) {
        if (param.type === ParamTypes.Primitive) {
          args[param.name] = (<any>param).value;
        } else if (param.type === ParamTypes.File) {
          args[param.name] = (<any>param).value.file;
        }
      }
    } 

    Promise.all(promises.map(p => p.catch(e => {
      this.requestDataError.push(e);
      throw e;
    })))
      .then(() => {
        this.http.post('/api/invoke', {
          app_id: this.app._id,
          version_id: this.app.algorithm._id,
          args,
          options: {
            output: {
              stderr: true,
              stdout: true,
              files: true,
              mode: this.outputMode.value
            },
            secure: this.secure,
            timeout: this.timeout
          }
        })
          .subscribe((data) => {
            this.processingResult = this.prepareResultData(data);
            this.onInvoke = false;
          });
      })
      .catch(() => {
        this.onInvoke = false;
      });
  }

  private prepareResultData(data) {
    data = this.getObjProperties(data);
    for (const obj of data) {
      if (this.isFileRef(obj.key)) {
        for (let i = 0; i < obj.value.length; i++) {
          obj.value[i] = this.getObjProperties(obj.value[i]);
          if (obj.value[i].length > 0) {
            obj.value[i][0].value = this.showObject(obj.value[i][0].value);
          }
        }
      } else {
        obj.value = this.showObject(obj.value);
      }
    }
    return data;
  }

  public openAddFilesModal(param) {
    this.addFileModalRef = this.modalService.show(AddFilesModalComponent, {
      class: 'modal-lg',
      ignoreBackdropClick: true,
      initialState: {
        files: this.app.algorithm.files,
        state: param.value ? param.value.state : null
      }
    });

    this.addFileModalRef.content.action.subscribe(value => {
      if (!value) {
        param.value = {};
        return;
      }
      param.value = {
        file: value.data,
        name: value.name,
        state: value.state
      };
    });
  }

}
