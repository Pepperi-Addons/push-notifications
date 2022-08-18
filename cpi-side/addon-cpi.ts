import '@pepperi-addons/cpi-node'
import { Client } from '@pepperi-addons/cpi-node/build/cpi-side/events';

export async function load(configuration: any) {
    pepperi.events.intercept("PushNotificationReceived" as any, {}, async (data, next) => {
        const main = async (data) => {
            await sync(data.client);
            console.log("Received notification:" ,data.Notification)
            if (data.Notification?.NavigatePath != undefined) {
                data.client?.navigateTo({
                    url: data.Notification?.NavigatePath,
                    history: "ClearAll",
                  });
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
    debugger;
    const syncOptions = {    
        "showHud": true
    };
    
    //const res = await client.sync(syncOptions);
    // if (res.canceled) {
    //     console.log('HUD canceled');
    //     console.log('blockResult :>> ', await res.result);
    // } else {
    //     console.log('HUD finished with result :>> ', res.result);
    // }
}

function sleep(ms: number) : Promise<void>{
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms)
    })
}