import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { DeviceManagmentComponent } from './device-managment.component';
import { config } from '../../addon.config';

export const routes: Routes = [
  {
      path: '',
      component: DeviceManagmentComponent
  }
];

@NgModule({
  declarations: [
    DeviceManagmentComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    PepGenericListModule,
    PepPageLayoutModule,
    PepTopBarModule,
    TranslateModule.forChild({
      loader: {
          provide: TranslateLoader,
          useFactory: (addonService: PepAddonService) => 
              PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
          deps: [PepAddonService]
      }, isolate: false
    }),
    RouterModule.forChild(routes)
  ],
  providers: [
    TranslateStore,
    // When loading this module from route we need to add this here (because only this module is loading).
  ]
})
export class DeviceManagmentModule {
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
 }
