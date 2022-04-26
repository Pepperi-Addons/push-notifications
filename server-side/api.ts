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

export async function create_notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.createNotifications(request.body);
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

export async function user_device_removed(client: Client, request: Request) {
    const service = new NotificationsService(client)

    await service.removeUserDeviceEndpoint(request.body);
}

// AWS endpoints
export async function create_platform_application(client: Client, request:Request) {
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
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function create_application_endpoint(client: Client, request:Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
       return service.createApplicationEndpoint(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function publish(client: Client, request:Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
       return service.publish(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

