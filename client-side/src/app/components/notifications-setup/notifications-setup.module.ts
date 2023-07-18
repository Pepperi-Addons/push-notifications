import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { TranslateService, TranslateModule, TranslateLoader, TranslateStore } from '@ngx-translate/core';
import { PepFileService,PepAddonService} from '@pepperi-addons/ngx-lib';
import { PepButton, PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { NotificationsSetupComponent } from './notifications-setup.component';
import { config } from '../../addon.config';
import { MessageCreatorModule } from '../message-creator/message-creator.module';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { DragDropModule } from '@angular/cdk/drag-drop';

export const routes: Routes = [
    {
        path: '',
        component: NotificationsSetupComponent,
    }
  ];
  @NgModule({
    declarations: [
      NotificationsSetupComponent,
    ],
    imports: [
      CommonModule,
      HttpClientModule,
      PepGenericListModule,
      PepGenericFormModule,
      PepPageLayoutModule,
      PepButtonModule,
      PepTopBarModule,
      PepDialogModule,
      PepDraggableItemsModule,
      DragDropModule,
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
    ]
  })

  export class NotificationsSetupModule { 
    constructor(
      translate: TranslateService,
      private addonService: PepAddonService
    ) {
      this.addonService.setDefaultTranslateLang(translate);
    }
  }