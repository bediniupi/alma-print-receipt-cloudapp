import { Component, Injectable, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../services/config.service';
import { snakeCase, startCase } from 'lodash';
import { configFormGroup, profileFormGroup } from '../../models/configuration';
import { CanDeactivate } from '@angular/router';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {
  form: FormGroup;
  selectedProfile: string;
  saving = false;
  startCase = startCase;

  constructor(
    private configService: ConfigService,
    private alert: AlertService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.configService.get().subscribe(config => {
      this.form = configFormGroup(config);
      this.selectedProfile = this.profileKeys[0];
    });
  }

  save() {
    this.saving = true;
    let val = this.form.value;
    this.configService.set(val).subscribe(
      () => {
        this.alert.success(this.translate.instant('Configuration.Success'));
        this.form.markAsPristine();
      },
      err => this.alert.error(err.message),
      ()  => this.saving = false
    );
  }  

  get profileKeys() { 
    return Object.keys(this.profiles.value) 
  }

  get profiles() {
    return this.form.controls.profiles as FormGroup;
  }

  addProfile() {
    let name = snakeCase(prompt(this.translate.instant('Configuration.ProfileName')));
    if (!!name) {
      if (this.profileKeys.includes(name)) {
        return alert(this.translate.instant('Configuration.ProfileExists',{name: name}));
      } else {
        this.profiles.addControl(name, profileFormGroup());
        this.selectedProfile = name;
        this.form.markAsDirty();  
      }
    }
  }

  deleteProfile() {
    if (confirm(this.translate.instant('Configuration.ConfirmDeleteProfile', {name: startCase(this.selectedProfile)}))) {
      this.profiles.removeControl(this.selectedProfile);
      this.selectedProfile = this.profileKeys[0];
      this.form.markAsDirty();
    }
  }

  renameProfile() {
    let name = snakeCase(prompt(this.translate.instant('Settings.RenameProfile'), startCase(this.selectedProfile)));
    if (!!name) {
      if (this.profileKeys.includes(name)) {
        return alert(this.translate.instant('Configuration.ProfileExists',{name: name}));
      } else {
        this.profiles.addControl(name, this.profiles.get(this.selectedProfile));
        this.profiles.removeControl(this.selectedProfile);
        this.selectedProfile = name;
        this.form.markAsDirty();
      }
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationGuard implements CanDeactivate<ConfigurationComponent> {
  constructor(
    private translate: TranslateService
  ) {}

  canDeactivate(component: ConfigurationComponent): boolean {
    if(component.form.dirty) {
      return confirm(this.translate.instant('Configuration.Discard'));
    }
    return true;
  }
}