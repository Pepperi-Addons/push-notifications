import { Injectable } from '@angular/core';
import { User } from '@pepperi-addons/papi-sdk';
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
    updateNotificationReadStatus(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/update_notifications_read_status`, notifications).toPromise()
    }

    bulkNotifications(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/bulk_notifications`, notifications).toPromise()
    }

    async getUserName(userUUID: string) {
        const user: User = await this.addonService.papiClient.users.uuid(userUUID).get();
        if (user != undefined) {
            return user.FirstName + user.LastName;
        }
    }
}