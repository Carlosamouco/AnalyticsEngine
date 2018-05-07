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

  public onInvoke: boolean;

  public showResults: boolean;
  public hideResults: boolean;

  public hideMainContainer: boolean;
  public hideSecundaryContainer: boolean;

  public addFileModalRef: BsModalRef;

  constructor(private route: ActivatedRoute, private router: Router, private modalService: BsModalService, private http: HttpClient) {
    const data = route.snapshot.data['apps'];
    this.app = data;
    this._initParamVals();
    if (!this.app) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }
    this.timeout = 5000;
    this.secure = false;

    this.onInvoke = false;

    this.showResults = false;
    this.hideSecundaryContainer = true;
    this.hideMainContainer = false;
    this.hideResults = false;
  }

  private _initParamVals() {
    for (const param of this.app.algorithm.parameters) {
      (<any>param).useDefault = true;
      this.setDefault(param);
    }
  }

  ngOnInit() {
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
    if (animation === 'rotateFoldLeft') {
      this.hideMainContainer = true;
      this.showResults = false;
      console.log(1);
    }
    if (animation === 'moveFromLeftFade') {
      this.hideSecundaryContainer = true;
      this.hideResults = false;
      console.log(2);
    }
  }

  public onNewRun() {
    this.hideMainContainer = false;
    this.hideResults = true;
  }

  public validateForm() {
    if (this.onInvoke) {
      return true;
    }

    for (const param of this.app.algorithm.parameters) {
      if (param.options.required && !(<any>param).useDefault) {
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
    this.processingResult = null;
    const args = {};

    this.showResults = true;
    this.hideSecundaryContainer = false;

    for (const param of this.app.algorithm.parameters) {
      if ((<any>param).value && !(<any>param).useDefault) {
        if (param.type === ParamTypes.Primitive) {
          args[param.name] = (<any>param).value;
        } else if (param.type === ParamTypes.File) {
          args[param.name] = (<any>param).value.file;
        }
      }
    }

    this.onInvoke = true;
    this.http.post('/api/invoke', {
      app_id: this.app._id,
      version_id: this.app.algorithm._id,
      args,
      options: {
        output: {
          stderr: true,
          stdout: true,
          files: true,
          mode: 0
        },
        secure: this.secure,
        timeout: this.timeout
      }
    })
      .subscribe((data) => {
        this.processingResult = data;
        this.onInvoke = false;
      });
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
