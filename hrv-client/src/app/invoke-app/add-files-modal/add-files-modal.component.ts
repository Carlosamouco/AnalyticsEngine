import { Component, OnInit, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-add-files-modal',
  templateUrl: './add-files-modal.component.html',
  styleUrls: ['./add-files-modal.component.css']
})
export class AddFilesModalComponent implements OnInit, AfterViewInit {
  @Output() public action = new EventEmitter();
  @ViewChild('uploadedInput') public uploadedInput: ElementRef;
  @ViewChild('uploadedMenu') public uploadedMenu: ElementRef;
  @ViewChild('fileInput') public fileInput: ElementRef;

  public files: string[];
  public filteredFiles: string[];

  public method: string;
  public menuIndex: number;
  public showMenu: boolean;
  public mouseOverMenu: boolean;
  public postDataEncodig: string;
  public postDataFile: string;
  public postDataExtention: string;
  public uploadedFileInput: string;

  public state: any;

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit() {
    this.method = 'upload';
    this.postDataEncodig = 'utf8';
    this.postDataFile = '';
    this.menuIndex = 0;
    this.showMenu = false;
    this.mouseOverMenu = false;
    this.filteredFiles = this.files.slice();


  }

  ngAfterViewInit() {
    if (this.state) {
      this.method = this.state.method;
      switch (this.state.method) {
        case 'upload':
          this.fileInput.nativeElement.files = this.state.fileInput.files;
          break;
        case 'postdata':
          this.postDataFile = this.state.postDataFile;
          this.postDataEncodig = this.state.postDataEncodig;
          this.postDataExtention = this.state.postDataExtention;
          break;
        case 'uploaded':
          this.uploadedFileInput = this.state.uploadedFileInput;
          break;
      }
    }
  }

  public onSubmit() {
    switch (this.method) {
      case 'upload':
        const reader = new FileReader();
        const file: File = this.fileInput.nativeElement.files[0];
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64result = reader.result.split(',')[1];
          this.action.emit({
            state: {
              method: this.method,
              fileInput: this.fileInput.nativeElement
            },
            data: {
              fileRef: {
                name: file.name,
                size: file.size
              }
            },
            name: file.name
          });
        };
        reader.onerror = (error) => {
          this.bsModalRef.hide();
        };
        break;
      case 'postdata':
        let fileData;
        try {
          fileData = JSON.parse(this.postDataFile);
        } catch (err) {
          fileData = this.postDataFile;
        }
        this.action.emit({
          state: {
            method: this.method,
            postDataFile: this.postDataFile,
            postDataEncodig: this.postDataEncodig,
            postDataExtention: this.postDataExtention
          },
          data: {
            data: fileData,
            encoding: this.postDataEncodig,
            extention: this.postDataExtention
          },
          name: this.postDataFile.replace(/\n/g, ' ').slice(0, 50)
        });
        break;
      case 'uploaded':
        this.action.emit({
          state: {
            method: this.method,
            uploadedFileInput: this.uploadedFileInput
          },
          data: this.uploadedFileInput,
          name: this.uploadedFileInput
        });
        break;
    }
    this.bsModalRef.hide();
  }

  public cancelFile() {
    this.action.emit();
    this.bsModalRef.hide();
  }

  public validateForm() {
    switch (this.method) {
      case 'upload':
        if (!this.fileInput || this.fileInput.nativeElement.files.length === 0) {
          return true;
        }
        break;
      case 'postdata':
        if (this.postDataFile.length === 0) {
          return true;
        }
        break;
      case 'uploaded':
        if (this.files.indexOf(this.uploadedFileInput) === -1) {
          return true;
        }
        break;
      default:
        return true;
    }

    return false;
  }

  public onFilesChange(input, lable) {
    if (input.files.length === 1) {
      lable.textContent = input.files[0].name;
    } else {
      lable.textContent = '';
    }
  }

  public filterMenu(target) {
    const str = target.value;
    this.filteredFiles = [];

    for (const file of this.files) {
      if (file.match(new RegExp(str, 'i'))) {
        this.filteredFiles.push(file);
      }
    }

    this.menuIndex = this.menuIndex >= this.filteredFiles.length ? this.menuIndex = this.filteredFiles.length - 1 : this.menuIndex;
    this.menuIndex = this.menuIndex < 0 ? 0 : this.menuIndex;
  }

  public hideMenu() {
    if (!this.mouseOverMenu) {
      this.showMenu = false;
    }

    if (this.files.indexOf(this.uploadedFileInput) === -1) {
      this.uploadedFileInput = '';
      this.filteredFiles = this.files.slice();
    }
  }

  public selectItem() {
    this.uploadedFileInput = this.filteredFiles[this.menuIndex];
    this.showMenu = false;
  }

  public menuNavigate(event) {
    switch (event.key) {
      case 'ArrowDown':
        this.menuIndex = ++this.menuIndex % this.filteredFiles.length;
        break;
      case 'ArrowUp':
        this.menuIndex = --this.menuIndex < 0 ? this.filteredFiles.length - 1 : this.menuIndex;
        break;
      case 'Enter':
        this.uploadedFileInput = this.filteredFiles[this.menuIndex];
        this.uploadedInput.nativeElement.blur();
        break;
    }
    const elem = this.uploadedMenu.nativeElement;
    const height = elem.clientHeight;
    const top = elem.children[this.menuIndex].offsetTop + 32;
    const itemHeight = elem.children[this.menuIndex].clientHeight;
    const scroll = elem.scrollTop;

    if (this.menuIndex === 0) {
      elem.scrollTop = 0;
    } else if (this.menuIndex === this.filteredFiles.length - 1) {
      elem.scrollTop = elem.scrollHeight;
    } else if (height + scroll < top) {
      elem.scrollTop = scroll + itemHeight;
    } else if (scroll > top - itemHeight) {
      elem.scrollTop = scroll - itemHeight;
    }

  }

}
