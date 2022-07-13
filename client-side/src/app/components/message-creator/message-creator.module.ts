import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageCreatorComponent } from './message-creator.component';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepFileService, PepAddonService} from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PepSnackBarModule } from '@pepperi-addons/ngx-lib/snack-bar';

@NgModule({
  imports: [
    CommonModule,
    PepTextboxModule,
    PepTextareaModule,
    PepPageLayoutModule,
    PepTopBarModule,
    PepButtonModule,
    MatSnackBarModule,
    PepSnackBarModule,
    TranslateModule.forChild({

      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) =>
          PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService),
        deps: [HttpClient, PepFileService, PepAddonService],

      }, isolate: false

    }),
  ],
  declarations: [MessageCreatorComponent]
})
export class MessageCreatorModule {
  constructor(
    translate: TranslateService,
    private addonService: PepAddonService
  ) {
    this.addonService.setDefaultTranslateLang(translate);
  }
 }
