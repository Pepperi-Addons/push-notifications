import '@pepperi-addons/cpi-node'

export async function load(configuration: any) {
    pepperi.events.intercept("PushNotificationRecieved" as any, {}, async (data, next) => {
        const main = async (data) => {
            const page = await pepperi.slugs.getPage("/notifications");
            if (page.success) {
                data.client?.navigateTo({ url: '/notifications'});
            } else {
                data.client?.navigateTo({ url: '/homepage' });
            }
        };
        await next(main)  
    });
}