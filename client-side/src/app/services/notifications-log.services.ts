import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { config } from '../addon.config';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class NotificationsLogService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = config.AddonUUID;
    }

    getNotificationsLog() {
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications_log`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    deleteNotificationsLog(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_notifications_log`, notifications).toPromise()
    }
}