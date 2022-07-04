import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MessageCreatorComponent } from './components/message-creator/message-creator.component';
import { DeviceManagmentComponent } from './components/device-managment/device-managment.component';
import { NotificationsLogComponent } from './components/notifications-log/notifications-log.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: `settings/:addon_uuid`,
        children: [
            {
                path: 'device_managment',
                component: DeviceManagmentComponent
            },
            {
                path: 'notifications_log',
                component: NotificationsLogComponent
            }
        ]
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }



