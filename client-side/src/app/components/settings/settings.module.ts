import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';

import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings.routes';

@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        SettingsRoutingModule,
        TranslateModule.forChild(),
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
