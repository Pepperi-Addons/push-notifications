import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepIconModule } from '@pepperi-addons/ngx-lib/icon';

import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import { NotificationsComponent } from './notifications.component';
import { DateAgoPipe } from './date-ago.pipe';

@NgModule({
    imports: [
        CommonModule,
        // Ngx-lib modules
        PepNgxLibModule,
        PepButtonModule,
        PepIconModule,
        // Material modules
        MatMenuModule,
        MatIconModule,
        MatRadioModule
    ],
    exports: [NotificationsComponent],
    declarations: [NotificationsComponent, DateAgoPipe],
})
export class NotificationsModule { }
