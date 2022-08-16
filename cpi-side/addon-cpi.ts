import '@pepperi-addons/cpi-node'

export async function load(configuration: any) {
    pepperi.events.intercept("PushNotificationReceived" as any, {}, async (data, next) => {
        const main = async (data) => {
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