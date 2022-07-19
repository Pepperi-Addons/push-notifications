import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { PepButton, PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { NotificationsLogComponent } from './notifications-log.component';
import { config } from '../../addon.config';

export const routes: Routes = [
  {
      path: '',
      component: NotificationsLogComponent
  }
];
@NgModule({
  declarations: [
    NotificationsLogComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    PepGenericListModule,
    PepPageLayoutModule,
    PepButtonModule,
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
