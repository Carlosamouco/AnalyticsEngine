import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { UploadModalComponent } from './upload-modal/upload-modal.component';
import { ApplicationDetails, Parameter } from './app-details.types';
import { Endpoint } from '../list-endpoints/list-endpoints.types';

import { AuthService } from './../auth.service';

@Component({
  selector: 'app-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.css']
})
export class AppDetailsComponent implements OnInit {
  public app: ApplicationDetails;
  public files: any;
  public parent: any;
  public path: string[];
  public uploadModalRef: BsModalRef;
  public parameters: Parameter[];
  public endpoints: Endpoint[];

  public menuItems: String[];
  public menuIndex: number;
  public mouseOverMenu: boolean;
  public showMenu: boolean;
  public currentItem: any;
  @ViewChild('selectFileMenu') public selectFileMenu: ElementRef;

  private copyFout: any;
  private copyParam: Parameter;
  private copyStream: any;

  constructor(private route: ActivatedRoute, private http: HttpClient,
    private router: Router, private modalService: BsModalService, public auth: AuthService) {

    const data = route.snapshot.data['app'];
    this.endpoints = route.snapshot.data['endpoints'];

    if (!data) {
      this.router.navigate(['/404'], { skipLocationChange: true });
    }
    this.prepareData(data);
  }

  ngOnInit() {
    this.menuIndex = 0;
    this.menuItems = [];
    this.mouseOverMenu = false;
    this.showMenu = false;

    this.route.params.subscribe(params => {
      this.http.get<ApplicationDetails>(`/api/application/${params['appId']}/${params['versionId']}`)
        .subscribe((data) => {
          if (!data) {
            this.router.navigate(['/404'], { skipLocationChange: true });
          }
          this.prepareData(data);
        });
    });
  }

  public filterMenu(value, items) {
    const str = value;
    this.menuItems = [];

    for (const item of items) {
      if (item.match(new RegExp(str, 'i'))) {
        this.menuItems.push(item);
      }
    }

    this.menuIndex = this.menuIndex >= this.menuItems.length ? this.menuIndex = this.menuItems.length - 1 : this.menuIndex;
    this.menuIndex = this.menuIndex < 0 ? 0 : this.menuIndex;
  }

  public menuNavigate(event, model) {
    switch (event.key) {
      case 'ArrowDown':
        this.menuIndex = ++this.menuIndex % this.menuItems.length;
        break;
      case 'ArrowUp':
        this.menuIndex = --this.menuIndex < 0 ? this.menuItems.length - 1 : this.menuIndex;
        break;
      case 'Enter':
        model.default = this.menuItems[this.menuIndex];
        event.target.blur();
        break;
    }

    const elem = this.selectFileMenu.nativeElement;
    const height = elem.clientHeight;
    const top = elem.children[this.menuIndex].offsetTop + 32;
    const itemHeight = elem.children[this.menuIndex].clientHeight;
    const scroll = elem.scrollTop;

    if (this.menuIndex === 0) {
      elem.scrollTop = 0;
    } else if (this.menuIndex === this.menuItems.length - 1) {
      elem.scrollTop = elem.scrollHeight;
    } else if (height + scroll < top) {
      elem.scrollTop = scroll + itemHeight;
    } else if (scroll > top - itemHeight) {
      elem.scrollTop = scroll - itemHeight;
    }
  }

  public openMenu(target, model, items) {
    this.currentItem = model;
    this.showMenu = true;

    this.filterMenu(model.default ? model.default : '', items);

    const elem = this.selectFileMenu.nativeElement;
    elem.style.top = (target.getBoundingClientRect().top + window.scrollY + target.clientHeight + 3) + 'px';
    elem.style.left = (target.getBoundingClientRect().left + window.scrollX) + 'px';
  }

  public hideMenu() {
    if (!this.mouseOverMenu) {
      this.showMenu = false;
    }
  }

  public selectItem() {
    this.currentItem.default = this.menuItems[this.menuIndex];
    this.showMenu = false;
  }

  private prepareData(data) {
    this.app = data;

    this.prepareParameters(this.app.algorithm.parameters);

    this.parameters = this.app.algorithm.parameters.slice();
    this.path = [];

    if (!this.app.algorithm.entryApp) {
      (<any>this.app.algorithm.entryApp) = {
        appName: '',
        localFile: false,
        edit: true
      };
    }

    this.files = this.organizeFiles();
    this.parent = this.files.files;
  }

  private prepareParameters(parameters) {
    for (const param of parameters) {
      if (param.options.endpoint) {
        param.options.endpointId = param.options.endpoint._id;
      }
    }
  }


  public saveApp() {
    const i = this.app.algorithm.files.indexOf(this.app.algorithm.entryApp.appName);
    if (i !== -1) {
      this.app.algorithm.entryApp.localFile = true;
    } else {
      this.app.algorithm.entryApp.localFile = false;
    }

    this.http.post<any>('/api/create/entry', {
      version_id: this.app.algorithm._id,
      app_id: this.app._id,
      entryApp: {
        appName: this.app.algorithm.entryApp.appName,
        localFile: this.app.algorithm.entryApp.localFile
      }
    })
      .subscribe((data) => {
        (<any>this.app.algorithm.entryApp).edit = false;
      });
  }

  public orderParams(param: Parameter) {
    const i = this.parameters.indexOf(param);
    this.parameters.splice(i, 1);
    this.parameters.splice((<any>param).position, 0, param);
  }

  public deleteParameter(param: Parameter) {
    const i = this.parameters.indexOf(param);
    const n = this.app.algorithm.parameters.indexOf(param);
    this.app.algorithm.parameters.slice(n, 1);
    this.parameters.splice(i, 1);
    this.commitParameters();
  }

  public editParameter(param: Parameter) {
    for (const p of this.parameters) {
      if ((<any>p).edit) {
        this.cancelEditParameter(p);
      }
    }

    param.options.endpointId = param.options.endpoint ? param.options.endpoint._id : null;

    this.copyParam = {
      name: param.name,
      type: param.type,
      description: param.description,
      flag: param.flag,
      position: param.position,
      options: {
        static: param.options.static,
        required: param.options.required,
        default: param.options.default,
        endpoint: param.options.endpoint,
        endpointId: param.options.endpointId
      },
    };

    (<any>param).edit = true;
  }

  public cancelEditParameter(param: Parameter) {
    if (this.copyParam) {
      this.app.algorithm.parameters[this.copyParam.position] = this.copyParam;
      this.parameters = this.app.algorithm.parameters.slice();
      this.copyParam = null;
    } else {
      const i = this.app.algorithm.parameters.indexOf(param);
      this.app.algorithm.parameters.splice(i, 1);
      this.parameters = this.app.algorithm.parameters.slice();
    }
  }

  private equalParams(p1: Parameter, p2: Parameter) {
    return (p1.description === p2.description && p1.flag === p2.flag && p1.name === p2.name && p1.position === p2.position
      && p1.type === p2.type && p1.options.default === p2.options.default
      && p1.options.required === p2.options.required && p1.options.static === p2.options.static
      && p1.options.endpointId === p2.options.endpointId);
  }

  public saveParameter(param: Parameter) {
    if (this.copyParam && this.equalParams(param, this.copyParam)) {
      this.cancelEditParameter(param);
      return;
    }

    this.commitParameters();
  }

  private commitParameters() {
    this.http.post<any>('/api/create/parameters', {
      version_id: this.app.algorithm._id,
      app_id: this.app._id,
      parameters: this.parameters
    })
      .subscribe((data) => {
        this.updateParameters(data.app.algorithms[0].parameters);
        this.copyParam = null;
      });
  }

  public addParameter() {
    for (const param of this.app.algorithm.parameters) {
      if ((<any>param).edit) {
        if (this.copyParam) {
          this.cancelEditParameter(param);
        } else {
          return;
        }
      }
    }

    const newP = {
      defaultArg: '',
      allowDefault: false,
      edit: true,
      name: '',
      type: '0',
      description: '',
      flag: '',
      position: this.app.algorithm.parameters.length,
      options: {
        static: false,
        required: false,
        default: '',
      },
    };
    this.parameters.push(newP);
    this.app.algorithm.parameters.unshift(<any>newP);
  }

  public addFOut() {
    for (const fout of this.app.algorithm.output.files) {
      if ((<any>fout).edit) {
        if (this.copyFout) {
          this.cancelEditFOut(fout);
        } else {
          return;
        }
      }
    }

    const newF = {
      edit: true,
      fileRgx: '',
      extention: '',
      encoding: '',
      alias: ''
    };
    this.app.algorithm.output.files.push(<any>newF);
  }

  public cancelEditFOut(fout) {
    if (this.copyFout) {
      const i = this.app.algorithm.output.files.indexOf(fout);
      this.app.algorithm.output.files[i] = this.copyFout;
      this.copyFout = null;
    } else {
      const i = this.app.algorithm.output.files.indexOf(fout);
      this.app.algorithm.output.files.splice(i, 1);
    }
  }

  public checkFOutConstraints(fout) {
    const exists = this.app.algorithm.output.files.find((f) => {
      return f.alias === fout.alias && f !== fout;
    });

    if (fout.alias.length === 0 || exists) {
      return true;
    }

    if (fout.fileRgx.length === 0) {
      return true;
    }

    return false;
  }

  public deleteFOut(fout) {
    const n = this.app.algorithm.output.files.indexOf(fout);
    this.app.algorithm.output.files.splice(n, 1);
    this.commitOutput();
  }

  public saveFOut(fout) {
    if (fout.encoding === '' || fout.encoding == null) {
      delete fout.encoding;
    }
    if (fout.extention === '' || fout.extention == null) {
      delete fout.extention;
    }
    this.commitOutput();
  }

  private updateParameters(parameters) {
    for (const param of parameters) {
      if (param.options.endpointId) {
        param.options.endpoint = <any>this.endpoints.find((endpoint: any) => {
          return endpoint._id === param.options.endpointId;
        });
      }
    }

    this.app.algorithm.parameters = parameters;
    this.parameters = this.app.algorithm.parameters.slice();
  }

  public commitOutput() {
    this.http.post<any>('/api/create/output', {
      version_id: this.app.algorithm._id,
      app_id: this.app._id,
      files: this.app.algorithm.output.files
    })
      .subscribe((data) => {
        this.app.algorithm.output.files = data.app.algorithms[0].output.files;
        this.updateParameters(data.app.algorithms[0].parameters);
        this.copyParam = null;
        this.copyFout = null;
      });
  }

  public onAppChange(target) {
    const str = target.value.replace(/ /g, '');
    target.value = str;
  }

  public editStream(stream) {
    if ((<any>this.app.algorithm.output.stderr).edit) {
      this.cancelEditStream('stderr');
    }
    if ((<any>this.app.algorithm.output.stdout).edit) {
      this.cancelEditStream('stdout');
    }
    this.copyStream = {
      alias: stream.alias,
      extention: stream.extention
    };
    stream.edit = true;
  }

  public cancelEditStream(stream) {
    this.app.algorithm.output[stream] = this.copyStream;
  }

  public checkStreamConstraints(stream) {
    if (stream !== this.app.algorithm.output.stderr && stream.alias === this.app.algorithm.output.stderr.alias) {
      return true;
    }
    if (stream !== this.app.algorithm.output.stdout && stream.alias === this.app.algorithm.output.stdout.alias) {
      return true;
    }
    return false;
  }

  public saveStream() {
    this.http.post<any>('/api/create/streams', {
      version_id: this.app.algorithm._id,
      app_id: this.app._id,
      stdout: this.app.algorithm.output.stdout,
      stderr: this.app.algorithm.output.stderr
    })
      .subscribe((data) => {
        const output = data.app.algorithms[0].output;
        this.app.algorithm.output.stdout = output.stdout;
        this.app.algorithm.output.stderr = output.stderr;
      });
  }

  public editOutput(fout) {
    for (const f of this.app.algorithm.output.files) {
      if ((<any>f).edit) {
        this.cancelEditFOut(f);
      }
    }

    this.copyFout = {
      fileRgx: fout.fileRgx,
      extention: fout.extention,
      encoding: fout.encoding,
      alias: fout.alias
    };

    fout.edit = true;
  }

  public checkParamConstraints(param: Parameter) {
    const exists = this.app.algorithm.parameters.find((p: Parameter) => {
      return p.name === param.name && p.position !== param.position;
    });

    if (param.name.length === 0 || exists) {
      return true;
    }

    if (!param.flag && param.options.static && (!param.options.default || param.options.default === '')) {
      return true;
    }

    return false;
  }

  public onDefaultChange(options) {
    if (this.app.algorithm.files.indexOf(options.default) === -1) {
      options.default = '';

    }
  }

  public onEndpointChange(target, param) {
    if (target.selectedIndex === 0) {
      target.selectedIndex = -1;
      delete param.options.endpointId;
    }
  }

  public openUploadModal() {
    this.uploadModalRef = this.modalService.show(UploadModalComponent, {
      initialState: {
        app_id: this.app._id,
        version_id: this.app.algorithm._id
      }
    });

    this.uploadModalRef.content.action.subscribe(value => {
      this.app.algorithm.files = value;
      this.files = this.organizeFiles();
      this.parent = this.files.files;
    });
  }

  public expandFolder(file) {
    this.parent = file.files;
    this.path.push(file.path);
  }

  public travelBack(index) {
    let foder = this.files;
    let i = 0;
    for (; i <= index; i++) {
      foder = foder.files.find(elem => {
        return elem.path === this.path[i];
      });
    }
    this.path.splice(i);
    this.parent = foder.files;
  }

  private organizeFiles() {
    const fsys = { path: '', files: [] };
    this.app.algorithm.files.forEach(file => {
      const parts = file.split('/');

      let path = fsys;

      for (let i = 0; i < parts.length; i++) {
        const f = path.files.find(elem => {
          return elem.path === parts[i];
        });
        if (!f) {
          if (parts.length - 1 === i) {
            path.files.push({ path: parts[i] });
          } else {
            const temp = { path: parts[i], files: [] };
            path.files.unshift(temp);
            path = temp;
          }
        } else {
          path = f;
        }
      }
    });

    return fsys;
  }
}


