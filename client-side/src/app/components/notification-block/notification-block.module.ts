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
import { config } from '../../addon.config';

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
         TranslateStore
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