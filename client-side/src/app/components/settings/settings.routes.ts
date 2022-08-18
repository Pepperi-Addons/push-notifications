import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

// import { MessageCreatorComponent } from '../message-creator/message-creator.component';
import { DeviceManagmentComponent } from '../device-managment/device-managment.component';
import { NotificationsLogComponent } from '../notifications-log';
import { MessageCreatorComponent } from '../message-creator';
// import { NotificationsLogComponent } from '../notifications-log/notifications-log.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div>Route is not exist settings.</div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID', // /:slugName'
        component: SettingsComponent,
        children: [
            {
                path: 'device_managment',
                component: DeviceManagmentComponent
            },
            {
                path: 'notifications_log',
                component: NotificationsLogComponent,
            },
            {
                path: 'notifications_log/message_creator',
                component: MessageCreatorComponent,
            },
            { path: '**', component: EmptyRouteComponent }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



