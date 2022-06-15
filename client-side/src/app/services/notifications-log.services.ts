import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class NotificationsLogService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
    }

    getNotificationsLog() {
        let url = `/addons/api/${this.addonService.addonUUID}/api/notifications_log`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }
}