import { NgModule, Injector, DoBootstrap } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationBlockComponent, NotificationBlockModule } from './components/notification-block';
import { NotificationBlockEditorComponent, NotificationBlockEditorModule } from './components/notification-block-editor';
import { MessageCreatorModule } from './components/message-creator'
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { DeviceManagmentComponent, DeviceManagmentModule } from './components/device-managment';
import { NotificationsLogComponent, NotificationsLogModule } from './components/notifications-log';
import { PopupDialogComponent } from './components/popup-dialog/popup-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';

// import { AddonModule } from './components/addon/addon.module';

import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';

import { config } from './addon.config';
import { SettingsComponent, SettingsModule } from './components/settings';

@NgModule({
    declarations: [	
        AppComponent,
        PopupDialogComponent
   ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        // AddonModule,
        AppRoutingModule,
        SettingsModule,
        NotificationBlockModule,
        NotificationBlockEditorModule,
        MessageCreatorModule,
        DeviceManagmentModule,
        NotificationsLogModule,
        PepButtonModule,
        MatDialogModule,
        PepDialogModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService,
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        this.pepAddonService.defineCustomElement(`notifications-element-${config.AddonUUID}`, NotificationBlockComponent, this.injector);
        this.pepAddonService.defineCustomElement(`notifications-editor-element-${config.AddonUUID}`, NotificationBlockEditorComponent, this.injector);

        this.pepAddonService.defineCustomElement(`device-managment-element-${config.AddonUUID}`, DeviceManagmentComponent, this.injector);
        this.pepAddonService.defineCustomElement(`notifications-log-element-${config.AddonUUID}`, SettingsComponent, this.injector);
    }
}