export interface INotificationItem {
    key: string;
    title: string;
    body?: string;
    read: boolean;
    from?: string;
    date: Date;
    navigationPath: string;
    goToActivityName?: string;
}
