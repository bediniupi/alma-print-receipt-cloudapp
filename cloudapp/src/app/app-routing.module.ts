import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent, ConfigurationGuard } from './configuration/configuration.component';
import { MainComponent } from './main/main.component';
import { SlipComponent } from './slip/slip.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'configuration', component: ConfigurationComponent, canDeactivate: [ConfigurationGuard] },
  { path: 'slip', component: SlipComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
