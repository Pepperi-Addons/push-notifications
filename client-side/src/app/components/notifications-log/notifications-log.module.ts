import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { PepButton, PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { NotificationsLogComponent } from './notifications-log.component';
import { config } from '../../addon.config';
import { MessageCreatorModule } from '../message-creator/message-creator.module';
export const routes: Routes = [
  {
      path: '',
      component: NotificationsLogComponent,
  }
];
@NgModule({
  declarations: [
    NotificationsLogComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    PepGenericListModule,
    PepPageLayoutModule,
    PepButtonModule,
    PepTopBarModule,
    MessageCreatorModule,
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
export class NotificationsLogModule { 
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
}
