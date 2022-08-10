import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';

import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings.routes';

import { DeviceManagmentModule } from '../device-managment';
import { NotificationsLogModule } from '../notifications-log';

import { config } from '../../addon.config';

@NgModule({
    declarations: [
        SettingsComponent,
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        SettingsRoutingModule,
        DeviceManagmentModule,
        NotificationsLogModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ]
})
export class SettingsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService

    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
