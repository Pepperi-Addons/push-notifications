import '@pepperi-addons/cpi-node'
import config from "../addon.config.json"

export async function load(configuration: any) {
    console.log('cpi side works!');

    const manager = new PushNotificationsCPIManager();
    manager.load();
}

class PushNotificationsCPIManager {

    deviceToken: string = "";
    applicationARN: string = "";

    constructor() {
    }

    load() {
        this.subscribe()
    }

    subscribe() {
        pepperi.events.intercept(
            "TSAButtonPressed",
            {},
            async (data, next, main) => {
               // const res = await data.client.clientAction({Type: "PushNotifications"} );
              //  if (res.Success) {
                    // const status = await pepperi.papiClient.addons.api.uuid(config.AddonUUID).file('api').func('create_application_endpoint').post(
                    //     {
                    //         ApplicationARN: this.applicationARN,
                    //         DeviceToken: res.DeviceToken
                    //     });
           //     }
            }
        );
    }

}