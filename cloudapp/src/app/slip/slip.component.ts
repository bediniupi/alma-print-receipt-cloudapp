import { Component, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CloudAppEventsService, CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { forkJoin, iif, of } from 'rxjs';
import { switchMap, tap, delay } from 'rxjs/operators';
import { Config, Profile } from '../../models/configuration';
import { Loan } from '../../models/loan';
import { User } from '../../models/user';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-slip',
  templateUrl: './slip.component.html',
})
export class SlipComponent implements OnInit {
  @Input() profileName: string;
  profile: Profile;
  config: Config;
  loans: Loan[];
  user: User;
  library: string;
  loanFields = ['item_barcode', 'title', 'author', 'loan_date', 'due_date', 'call_number'];

  /* Templates */
  @ViewChild('viewContainer', { read: ViewContainerRef, static: false }) viewContainer: ViewContainerRef;
  @ViewChild('signatureTmpl', { read: TemplateRef }) signatureTmpl: TemplateRef<any>;
  @ViewChild('logoTmpl', { read: TemplateRef }) logoTmpl: TemplateRef<any>;
  @ViewChild('institutionTmpl', { read: TemplateRef }) institutionTmpl: TemplateRef<any>;
  @ViewChild('libraryTmpl', { read: TemplateRef }) libraryTmpl: TemplateRef<any>;
  @ViewChild('titleTmpl', { read: TemplateRef }) titleTmpl: TemplateRef<any>;
  @ViewChild('userTmpl', { read: TemplateRef }) userTmpl: TemplateRef<any>;
  @ViewChild('loansTmpl', { read: TemplateRef }) loansTmpl: TemplateRef<any>;
  views: { [key: string]: TemplateRef<any> } = { };

  constructor(
    private restService: CloudAppRestService,
    private configService: ConfigService,
    private eventsService: CloudAppEventsService,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.views = {
      signature: this.signatureTmpl,
      logo: this.logoTmpl,
      inst_name: this.institutionTmpl,
      library_name: this.libraryTmpl,
      title: this.titleTmpl,
      patron: this.userTmpl,
      loan_list: this.loansTmpl
    }
  }

  load(profileName: string, links: string[]) {
    return this.configService.get().pipe(
      tap(config => {
        this.profile=config.profiles[profileName];
        if (!this.profile.display_authors) 
          this.loanFields.splice(this.loanFields.indexOf('author'),1);
      }),
      switchMap(() => this.getLibraryName()),
      switchMap(() => forkJoin(links.map(l=>this.restService.call<Loan>(l)))),
      tap(loans => this.loans=loans),
      switchMap(loans => this.restService.call(`/users/${loans[0].user_id}`)),
      tap(user => this.user=user),
      delay(10), /* Allow viewContainer to be instatiated */
      tap(() => {
        this.profile.order.forEach(o=>this.viewContainer.createEmbeddedView(this.views[o]));
      })
    );
  }

  styles(style: string) {
    /* Allow in-line style */
    return this.sanitizer.bypassSecurityTrustStyle(this.profile.styles[style]);
  }

  getLibraryName() {
    return iif(
      ()=>!this.library,
      this.eventsService.getInitData().pipe(
        switchMap(info=>this.restService.call(`/conf/libraries/${info.user.currentlyAtLibCode}`)),
        tap(library=>this.library=library.name)
      ),
      of(null)
    )
  }
}
