import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationBlockEditorComponent } from './notification-block-editor.component';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService} from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';

import { config } from '../../addon.config';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild({
      loader: {
          provide: TranslateLoader,
          useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
              PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
          deps: [HttpClient, PepFileService, PepAddonService],
      }, isolate: false
  })
  ],
  exports: [NotificationBlockEditorComponent],
  providers: [
      TranslateStore,
      // Add here all used services.
  ],
  declarations: [NotificationBlockEditorComponent]
})
export class NotificationBlockEditorModule {
  constructor(
    translate: TranslateService,
    private pepAddonService: PepAddonService
) {
    this.pepAddonService.setDefaultTranslateLang(translate);
}
 }
