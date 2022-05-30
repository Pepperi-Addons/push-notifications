import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceManagmentComponent } from './device-managment.component';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    PepGenericListModule,
    PepPageLayoutModule,
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
  declarations: [DeviceManagmentComponent]
})
export class DeviceManagmentModule {
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
 }
