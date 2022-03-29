import NotificationsService from './notifications.service'
import { Client, Request } from '@pepperi-addons/debug-server'

export async function notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'GET') {
        return service.getNotifications(request.query);
    }
    if (request.method === 'POST') {
        return service.upsertNotifications(request.body);
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

export async function create_application_endpoint(client: Client, request:Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
       return service.createApplicationEndpoint(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function create_topic(client: Client, request:Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
       return service.createTopic(request.body);
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

export async function subscribe_device_to_topic(client: Client, request:Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
       return service.subscribeDeviceToTopic(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}
