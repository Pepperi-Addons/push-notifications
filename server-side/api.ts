import { NotifiactionsSnsService } from './notifications-sns.service';
import NotificationsService from './notifications.service'
import UsersListsService from './users-list.service'
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

export async function unread_notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'GET') {
        return service.unreadNotificationsCount();
    }
}

export async function notifications_users_lists(client: Client, request: Request) {
    const usersListsService = new UsersListsService(client)

    if (request.method === 'GET') {
        return usersListsService.getNotificationsUsersLists(request.query);
    }
    if (request.method === 'POST') {
        return usersListsService.upsertNotificationsUsersLists(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_notifications_users_lists(client: Client, request: Request) {
    const usersListsService = new UsersListsService(client)

    if (request.method === 'POST') {
        return usersListsService.deleteNotificationsUsersLists(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function update_notifications_read_status(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.updateNotificationsReadStatus(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function update_notification_read_status(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.updateNotificationReadStatus(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function notifications_soft_limt(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'GET') {
        return service.getNotificationsSoftLimit();
    }
    if (request.method === 'POST') {
        return service.setNotificationsSoftLimit(request.body);
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

export async function platform_removed(client: Client, request: Request) {
    const service = new NotificationsService(client)
    await service.removePlatformApplication(request.body);
}

// called when user create a notification.
// called by PNS subscription
export async function notification_inserted(client: Client, request: Request) {
    const service = new NotificationsService(client)

    await service.sendPushNotification(request.body);
}

// AWS endpoints
export async function platforms(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.upsertPlatformApplication(request.body);
    }
    if (request.method === 'GET') {
        return service.getPlatformApplication(request.query);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_all_platforms(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method === 'POST') {
        await service.deleteAllPlatformsApplication();
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function user_devices(client: Client, request: Request) {
    const service = new NotificationsService(client)

    if (request.method === 'POST') {
        return service.upsertUserDevice(request.body);
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

export async function delete_all_application_endpoints(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method === 'POST') {
        await service.deleteAllApplicationEndpoints();
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function create_application_endpoint(client: Client, request: Request) {
    const service = new NotifiactionsSnsService(client)
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
export async function bulk_notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'POST') {
        return service.bulkNotifications(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

// Usage Monitor
export async function total_daily_notifications(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'GET') {
        return service.getTotalNotificationsSentPerDay();
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function total_notifications_in_last_week(client: Client, request: Request) {
    const service = new NotificationsService(client)
    if (request.method == 'GET') {
        return service.getTotalNotificationsSentInTheLastWeekUsageData()
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function Test(client: Client, request: Request) {
    console.log(request.body);
}

// notifications log
export async function notifications_log(client: Client, request: Request) {
    const service = new NotificationsService(client);
    if (request.method == 'GET') {
        return service.getNotificationsLog();
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

export async function delete_notifications_log(client: Client, request: Request) {
    const service = new NotificationsService(client);
    if (request.method == 'POST') {
        return service.deleteNotificationsLog(request.body);
    }
    else {
        throw new Error(`Method ${request.method} not supported`);
    }
}

