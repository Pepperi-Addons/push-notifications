import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationBlockModule } from './components/notification-block';
import { NotificationBlockEditorModule } from './components/notification-block-editor';
import { MessageCreatorModule } from './components/message-creator'
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { DeviceManagmentModule } from './components/device-managment';
import { NotificationsLogModule } from './components/notifications-log';
import { PopupDialogComponent } from './components/popup-dialog/popup-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';


import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';

import { AppRoutingModule } from './app.routes';
import { AddonModule } from './components/addon/addon.module';
import { AppComponent } from './app.component';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';

@NgModule({
    declarations: [	
        AppComponent,
        PopupDialogComponent
   ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AddonModule,
        AppRoutingModule,
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
                useFactory: PepAddonService.createMultiTranslateLoader,
                deps: [PepAddonService]
            }
        })
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(
        translate: TranslateService
    ) {

        let userLang = 'en';
        translate.setDefaultLang(userLang);
        userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available

        if (location.href.indexOf('userLang=en') > -1) {
            userLang = 'en';
        }
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(userLang).subscribe((res: any) => {
            // In here you can put the code you want. At this point the lang will be loaded
        });
    } ??s
}