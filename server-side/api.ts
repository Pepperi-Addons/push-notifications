import NotificationsService from './notifications.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'GET') {
        return service.getNotifications(request.query);
    }
    if (request.method === 'POST') {
        return service.upsertNotification(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function mark_notifications_as_read(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.markNotificationsAsRead(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}
// user device has been removed because it's expiration date has arrived.
// called by PNS subscription
export async function user_device_removed(client: Client, request: Request) {
    const service = new NotificationsService(client)

    await service.removeUserDeviceEndpoint(request.body);
}

// called when user create a notification.
// called by PNS subscription
export async function notification_inserted(client: Client, request: Request) {
    const service = new NotificationsService(client)

    await service.sendPushNotification(request.body);
}

// AWS endpoints
export async function create_platform_application(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.createPlatformApplication(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function user_device(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.registerUserDevice(request.body);
    }
    if (request.method === 'GET') {
        return service.getUserDevices(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function remove_devices(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.removeDevices(request.body);
    }
}

export async function create_application_endpoint(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.createApplicationEndpoint(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function publish(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.publish(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// DIMX
// endpoints for the AddonRelativeURL of the relation
export async function import_notifications_source(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.importNotificationsSource(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

//called from client side
export async function import_notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.importNotifications(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

