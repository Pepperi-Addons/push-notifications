import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsLogComponent } from './notifications-log.component';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';
import { PepButton, PepButtonModule } from '@pepperi-addons/ngx-lib/button';

@NgModule({
  imports: [
    CommonModule,
    PepGenericListModule,
    PepPageLayoutModule,
    PepButtonModule,
    PepTopBarModule,
    TranslateModule.forChild({

      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) =>
          PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService),
        deps: [HttpClient, PepFileService, PepAddonService],

      }, isolate: false

    })
  ],
  declarations: [NotificationsLogComponent]
})
export class NotificationsLogModule { 
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
}
