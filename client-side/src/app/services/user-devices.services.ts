import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AddonService } from './addon.service';

@Injectable({
    providedIn: 'root'
})

export class UserDevicesService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = this.route.snapshot.params.addon_uuid;
    }

    getUserDevices() {
        const query =`?UserUUID=${this.addonService.userUUID}`;
        let url = `/addons/api/${this.addonService.addonUUID}/api/user_devices`
        url = url + query;
        
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    removeUserDevices(devicesKeys) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/remove_devices`, devicesKeys).toPromise();
    }
}