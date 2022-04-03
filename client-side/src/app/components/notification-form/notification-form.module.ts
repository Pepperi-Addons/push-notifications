import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { NotificationFormComponent } from './notification-form.component'
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepFileService, PepHttpService } from '@pepperi-addons/ngx-lib';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { config } from '../../addon.config';
import { PepGenericFormModule } from '@pepperi-addons/ngx-composite-lib/generic-form';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';

export const routes: Routes = [
    {
        path: '',
        component: NotificationFormComponent
    }
];

@NgModule({
    declarations: [NotificationFormComponent],
    imports: [
        CommonModule,
        PepButtonModule,
        PepGenericFormModule,
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
    exports: [NotificationFormComponent],
    providers: [
         TranslateStore
    ]
})

export class NotificationFormModule {
    constructor(
         translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
         this.pepAddonService.setDefaultTranslateLang(translate);
    }
}