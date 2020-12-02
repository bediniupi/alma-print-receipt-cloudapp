import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild, ComponentFactoryResolver, ViewContainerRef, ElementRef } from '@angular/core';
import { AlertService, CloudAppEventsService, CloudAppStoreService, Entity, EntityType } from '@exlibris/exl-cloudapp-angular-lib';
import { ConfigService } from '../../services/config.service';
import { Profile } from '../../models/configuration';
import { switchMap, tap } from 'rxjs/operators';
import { startCase } from 'lodash';
import { MatSelectChange } from '@angular/material/select'
import { SelectEntitiesComponent } from '../select-entities/select-entities.component';
import { SlipComponent } from '../slip/slip.component';

const SELECTED_PROFILE = 'selectedProfile';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private pageLoad$: Subscription;
  loading = false;
  ids = new Set<string>();
  entities: Entity[] = [];
  profiles: {[key: string]: Profile};
  selectedProfile: string;
  startCase = startCase;

  @ViewChild('iframe', { read: ElementRef }) iframe: ElementRef;

  constructor(
    private eventsService: CloudAppEventsService,
    private configService: ConfigService,
    private storeService: CloudAppStoreService,
    private resolver: ComponentFactoryResolver,
    private vcref: ViewContainerRef,
    private alert: AlertService,
  ) { }

  ngOnInit() {
    this.configService.get().pipe(
      tap(config => this.profiles = config.profiles),
      switchMap(() => this.storeService.get(SELECTED_PROFILE)),
      tap(profile => {
        if (profile) this.selectedProfile = profile;
        else this.selectedProfile = this.profileKeys[0];
      }),
    ).subscribe();

    this.pageLoad$ = this.eventsService.onPageLoad( pageInfo => {
      console.log('entities', this.entities);
      this.entities = (pageInfo.entities||[]).filter(e=>e.type==EntityType.LOAN);
    });
  }

  @ViewChild(SelectEntitiesComponent, {static: false}) 
  set selectEntities(content: SelectEntitiesComponent) {
    /* Default check all */
    setTimeout(() => {
      if (content) {
        content.masterChecked = true;
        content.masterChange();
      }
    },0)
  };

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  onEntitySelected(event) {
    if (event.checked) this.ids.add(event.mmsId);
    else this.ids.delete(event.mmsId);
  }

  print() {
    const links = this.entities.filter(e=>this.ids.has(e.id)).map(e=>e.link);
    const componentFactory = this.resolver.resolveComponentFactory(SlipComponent);
    const componentRef = this.vcref.createComponent(componentFactory);
    const doc = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
    doc.body.innerHTML = "";
    doc.body.appendChild(componentRef.location.nativeElement);
    this.loading = true;
    componentRef.instance.load(this.selectedProfile, links)
    .subscribe({
      next: () => {
        setTimeout(()=>this.iframe.nativeElement.contentWindow.print(), 100)
      },
      error: e => this.alert.error('An error occurred: ' + e),
      complete: () => this.loading = false
    });
  }

  onProfileSelected(event: MatSelectChange) {
    this.storeService.set(SELECTED_PROFILE, event.value).subscribe();
  }

  get profileKeys() { 
    return this.profiles ? Object.keys(this.profiles) : [];
  }
}
