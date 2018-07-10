import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import * as echarts from 'echarts';

import { AddFilesModalComponent } from './add-files-modal/add-files-modal.component';
import { ApplicationDetails } from './invoke-app.types';
import { isObject, isArray } from 'util';

enum ParamTypes {
  Primitive = '0',
  File = '1'
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
export class InvokeAppComponent implements OnInit, AfterViewInit {
  @ViewChild('hrvChartT') public hrvChartT: ElementRef;
  @ViewChild('hrvChartF') public hrvChartF: ElementRef;

  public app: ApplicationDetails;
  public processingResult: boolean;

  public chartT: any;
  public chartF: any;

  public secure: boolean;

  public onInvoke: boolean;

  public showResults: boolean;
  public hideResults: boolean;

  public hideMainContainer: boolean;
  public hideSecundaryContainer: boolean;

  public addFileModalRef: BsModalRef;

  public requestDataError: any[];

  private animationEnded: boolean;

  constructor(private route: ActivatedRoute, private router: Router, private modalService: BsModalService, private http: HttpClient) {
    this.secure = false;
    this.onInvoke = false;
    this.showResults = false;
    this.hideSecundaryContainer = true;
    this.hideMainContainer = false;
    this.hideResults = false;
    this.animationEnded = true;

    const data = route.snapshot.data['apps'];
    this.http.get<ApplicationDetails>(`/api/application/${data[0]._id}/${data[0].algorithms[0]._id}`)
      .subscribe((app) => {
        this.app = app;
        this._initParamVals();
      });
  }

  private _initParamVals() {
    for (const param of this.app.algorithm.parameters) {
      if (param.type === ParamTypes.File) {
        (<any>param).value = {};
      }

      if (param.options.default && !param.options.static && !param.options.endpoint) {
        (<any>param).useDefault = true;
        this.setDefault(param);
      }
    }
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
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
      this.processingResult = false;

      this.chartT = null;
      this.chartF = null;

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

      if (param.options.required) {
        if (param.options.endpoint) {
          for (const endP of param.options.endpoint.parameters) {
            if (!(<any>endP).value) {
              return true;
            }
          }
        } else if (!(<any>param).useDefault) {
          if (param.type === ParamTypes.Primitive && !(<any>param).value) {
            return true;
          } else if (param.type === ParamTypes.File && !(<any>param).value.file) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public invokeApp() {
    const args = {};
    const files: File[] = [];
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
      if (param.options.static) {
        continue;
      }

      if (param.options.endpoint) {
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
              request = this.http.post(url, [params]);
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
          if ((<any>param).value.file.fileRef) {
            files.push((<any>param).value.state.fileInput.files[0]);
          }
        }

      }

      Promise.all(promises.map(p => p.catch(e => {
        this.requestDataError.push(e);
        throw e;
      })))
        .then(() => {
          const formData: FormData = new FormData();

          formData.append('options', JSON.stringify({
            output: {
              stderr: true,
              stdout: true,
              files: true,
              mode: '1'
            },
            secure: this.secure,
            timeout: 60000
          }));
          formData.append('args', JSON.stringify(args));
          formData.append('app_id', this.app._id);
          formData.append('version_id', this.app.algorithm._id);
          for (const file of files) {
            formData.append('files', file, file.name);
          }
          this.http.post('/api/invoke/form', formData)
            .subscribe((data) => {
              this.processingResult = true;
              this.onInvoke = false;
              this.requestDataError = null;
              setTimeout(() => {
                const res = [];
                let error = true;
                Object.keys(data).forEach(elem => {
                  if (this.isFileRef(elem) && (<any>data)[elem][0] && Object.keys((<any>data)[elem][0]).length > 0) {
                    const file = Object.keys((<any>data)[elem][0])[0];
                    this.buildChartT((<any>data)[elem][0][file]);
                    this.buildChartF((<any>data)[elem][0][file]);
                    error = false;
                    return;
                  }
                  if ((<any>data)[elem] && !isArray((<any>data)[elem])) {
                    res.push({
                      status: elem,
                      message: (<any>data)[elem]
                    });
                  }
                });
                if (error) {
                  this.requestDataError = res;
                }
              }, 0);
            });
        })
        .catch(() => {
          this.onInvoke = false;
        });
    }
  }

  private buildChartF(hrvData) {
    const datasetsF = [];
    const xAxisF = [];
    let labelsF = ['HR', 'LF', 'HF', 'VLF', 'TotPwr', 'LF_HF'];

    hrvData.forEach(set => {
      const keys = Object.keys(set);

      for (let i = 0; i < keys.length; i++) {
        const n = labelsF.indexOf(keys[i]);
        if (keys[i] === 'End') {
          xAxisF.push(set[keys[i]]);
          continue;
        }
        if (n !== -1) {
          if (!datasetsF[n]) {
            datasetsF[n] = {
              data: [],
              name: keys[i] === 'LF_HF' ? `${keys[i]} (%)` : keys[i] === 'HR' ? `${keys[i]} (bpm)` : `${keys[i]} (dB)`,
              type: 'line',
              areaStyle: keys[i] === 'LF_HF' ? { normal: {} } : null,
              yAxisIndex: keys[i] === 'LF_HF' ? 1 : 0,
            };
          }
          datasetsF[n].data.push(Number(set[keys[i]]));
        }
      }
    });

    labelsF = ['HR (bpm)', 'LF (dB)', 'HF (dB)', 'VLF (dB)', 'TotPwr (dB)', 'LF_HF (%)'];

    this.chartF = echarts.init(this.hrvChartF.nativeElement);

    this.chartF.setOption({
      title: {
        text: 'HRV Frequency Domain',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        confine: true
      },
      legend: {
        data: labelsF,
        type: 'scroll',
        top: '40px',
        selected: {
        }
      },
      grid: {
        left: '3%',
        right: '5%',
        bottom: '3%',
        top: '80px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisF
      },
      yAxis: [{
        type: 'log',
        position: 'left',
      },
      {
        type: 'value',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value} %'
        }
      }],
      series: datasetsF
    });
  }

  private buildChartT(hrvData) {
    const datasetsT = [];
    const xAxisT = [];
    let labelsT = ['AVNN', 'SDNN', 'RMSSD', 'pNN20', 'pNN50'];

    hrvData.forEach(set => {
      const keys = Object.keys(set);

      for (let i = 0; i < keys.length; i++) {
        const n = labelsT.indexOf(keys[i]);
        if (keys[i] === 'End') {
          xAxisT.push(set[keys[i]]);
          continue;
        }
        if (n !== -1) {
          if (!datasetsT[n]) {
            datasetsT[n] = {
              data: [],
              name: keys[i] === 'pNN20' || keys[i] === 'pNN50' ? `${keys[i]} (%)` : `${keys[i]} (ms)`,
              type: 'line',
              areaStyle: keys[i] === 'pNN20' || keys[i] === 'pNN50' ? { normal: {} } : null,
              yAxisIndex: keys[i] === 'pNN20' || keys[i] === 'pNN50' ? 1 : 0,
            };
          }
          datasetsT[n].data.push(Number(set[keys[i]]));
        }
      }
    });

    labelsT = ['AVNN (ms)', 'SDNN (ms)', 'RMSSD (ms)', 'pNN20 (%)', 'pNN50 (%)'];

    this.chartT = echarts.init(this.hrvChartT.nativeElement);

    this.chartT.setOption({
      title: {
        text: 'HRV Temporal Domain',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        confine: true
      },
      legend: {
        data: labelsT,
        type: 'scroll',
        top: '40px',
        selected: {
        }
      },
      grid: {
        left: '3%',
        right: '5%',
        bottom: '3%',
        top: '80px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisT
      },
      yAxis: [{
        type: 'value',
        position: 'left',
        axisLabel: {
          formatter: '{value} ms'
        }
      },
      {
        type: 'value',
        position: 'right',
        axisLabel: {
          formatter: '{value} %'
        }
      }],
      series: datasetsT
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.chartT) {
      this.chartT.resize();
    }
    if (this.chartF) {
      this.chartF.resize();
    }
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
