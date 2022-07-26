"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
require("@pepperi-addons/cpi-node");
async function load(configuration) {
    console.log('cpi side works!');
    const manager = new PushNotificationsCPIManager();
    manager.load();
}
exports.load = load;
class PushNotificationsCPIManager {
    constructor() {
        this.deviceToken = "";
        this.applicationARN = "";
    }
    load() {
        this.subscribe();
    }
    subscribe() {
        pepperi.events.intercept("TSAButtonPressed", {}, async (data, next, main) => {
            // const res = await data.client.clientAction({Type: "PushNotifications"} );
            //  if (res.Success) {
            // const status = await pepperi.papiClient.addons.api.uuid(config.AddonUUID).file('api').func('create_application_endpoint').post(
            //     {
            //         ApplicationARN: this.applicationARN,
            //         DeviceToken: res.DeviceToken
            //     });
            //     }
        });
    }
}
//# sourceMappingURL=addon-cpi.js.map