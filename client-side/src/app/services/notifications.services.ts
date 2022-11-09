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

    getNotifications(whereClause?: string) {
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications?order_by=CreationDateTime desc`
        if (whereClause) {
            url = url + '&where=' + whereClause;
        }
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }
    updateNotificationsReadStatus(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/update_notifications_read_status`, notifications).toPromise()
    }

    updateNotificationReadStatus(notification){
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/update_notification_read_status`, notification).toPromise()
    }

    bulkNotifications(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/bulk_notifications`, notifications).toPromise()
    }
}