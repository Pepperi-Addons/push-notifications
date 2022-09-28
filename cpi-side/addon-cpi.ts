import '@pepperi-addons/cpi-node'
import { Client } from '@pepperi-addons/cpi-node/build/cpi-side/events';

export async function load(configuration: any) {
    pepperi.events.intercept("PushNotificationReceived" as any, {}, async (data, next) => {
        const main = async (data) => {
            console.log("Received notification:" ,data.Notification)
            if (data.Notification?.NavigationPath != undefined) {
                let res = await sync(data.client);
                if (res.success == true) {
                    data.client?.navigateTo({
                        url: data.Notification?.NavigationPath,
                        history: "ClearAll",
                      });
                }
                else {
                    console.log("sync action failed")
                }
            }
            else {
               await navigateToNotificationsSlug(data);
            }
        };
        await next(main)  
    });
}

async function navigateToNotificationsSlug(data: any) {
    // default navigation
    let url = '/homepage';
    const page = await pepperi.slugs.getPage("/notifications");
    if (page.success) {
        url = '/notifications'
    }
      data.client?.navigateTo({
        url: url,
        history: "ClearAll",
      });
}

async function sync(client: Client) {
    const syncOptions = {    
        "allowContinueInBackground": false
    };
    return client.sync(syncOptions);
}