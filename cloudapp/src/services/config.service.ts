import { Injectable } from "@angular/core";
import { CloudAppConfigService } from "@exlibris/exl-cloudapp-angular-lib";
import { Observable, of } from "rxjs";
import { map, tap } from "rxjs/operators";
import { Config, defaultConfig } from "../models/configuration";
import { merge } from "lodash";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  _config: Config;

  constructor( 
    private configService: CloudAppConfigService
  ) {  }

  get(): Observable<Config> {
    if (this._config) {
      return of(this._config);
    } else {
      return this.configService.get()
        .pipe(
          map(config=> merge(defaultConfig, config)),
          tap(config=>this._config=config)
        );
    }
  }

  set(val: Config) {
    this._config = val;
    return this.configService.set(val);
  }

}