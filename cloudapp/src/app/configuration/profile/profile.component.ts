import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { resizeImage } from './utils';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

const MAX_IMAGE_SIZE = 300;

@Component({
  selector: 'app-config-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @Input() form: FormGroup;

  constructor(
    private alert: AlertService
  ) { }

  ngOnInit() { }

  drop(event: CdkDragDrop<string[]>) {
    let array = this.form.get('order').value;
    moveItemInArray(array, event.previousIndex, event.currentIndex);
    this.form.patchValue({order: array})
  }

  fileChangeEvent(files: File[]) {
    resizeImage(files[0], MAX_IMAGE_SIZE)
    .then(result=>this.form.patchValue({institution_logo: result}))
    .catch(error=>this.alert.error('Error reading image' + error));
  }

  get logoUrl() {
    return this.form.get('institution_logo').value;
  }

}
