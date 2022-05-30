import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { NotificationBlockComponent } from './notification-block.component'
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { config } from '../../addon.config';
import { AddonService } from 'src/app/services/addon.service';
import { NotificationsService } from 'src/app/services/notifications.services';

export const routes: Routes = [
    {
        path: '',
        component: NotificationBlockComponent
    }
];

@NgModule({
    declarations: [NotificationBlockComponent],
    imports: [
        CommonModule,
        PepButtonModule,
        PepGenericListModule,
        PepGenericFormModule,
        PepButtonModule,
        PepDialogModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
                    PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
                deps: [HttpClient, PepFileService, PepAddonService],
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports: [NotificationBlockComponent],
    providers: [
         TranslateStore,
         AddonService,
         NotificationsService
    ]
})

export class NotificationBlockModule {
    constructor(
         translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
         this.pepAddonService.setDefaultTranslateLang(translate);
    }
}