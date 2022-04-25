import { Injectable } from '@angular/core';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class NotificationsService {
    constructor(
        private addonService: AddonService
    ) {

    }

    getNotifications(query?: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications`
        if (query) {
            url = url + query;
        }
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    upsertNotification(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/notifications`, notifications).toPromise();
    }

    markNotificationsAsRead(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/mark_notifications_as_read`, notifications).toPromise()
    }
}