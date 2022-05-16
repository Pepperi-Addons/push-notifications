export interface INotificationItem {
    key: string;
    title: string;
    body?: string;
    read: boolean;
    to?: string;
    date: Date;
    goToActivityName?: string;
}
