import { Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { INotificationItem } from './notifications.model';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

    private _items: INotificationItem[] = [];
    @Input()
    set items(value: INotificationItem[]) {
        this._items = value;
        this.calcShowMarkAllAsRead();
    }
    get items(): INotificationItem[] {
        return this._items;
    }

    @Output()
    markAllAsReadClick: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    itemClick: EventEmitter<INotificationItem> = new EventEmitter<INotificationItem>();

    @Output()
    itemReadClick: EventEmitter<INotificationItem> = new EventEmitter<INotificationItem>();

    showMarkAllAsRead: boolean = false;

    constructor() { }

    ngOnInit() {}

    private calcShowMarkAllAsRead() {
        this.showMarkAllAsRead = this._items.some(item => !item.read);
    }

    onMarkAllAsReadClick(btnEvent: IPepButtonClickEvent) {
        console.log('onMarkAllAsReadClick');
        this._items.forEach(item => item.read = true);
        this.calcShowMarkAllAsRead();
        this.markAllAsReadClick.emit();
    }

    onCloseClick(){
        console.log('onCloseClick');
        const eventData = {
            detail: {
                key: 'CloseChat',
                data: {
                }
            },
        };
        const event = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(event);
    }

    onNotificationItemClick(item: INotificationItem) {
        console.log('onNotificationItemClick');

        // Mark as read only if this notification is unread.
        if (!item.read) {
            item.read = true;
            this.calcShowMarkAllAsRead();
        }

        this.itemClick.emit(item);
    }

    onNotificationItemReadClick(btnEvent: IPepButtonClickEvent, item: INotificationItem) {
        console.log('onNotificationItemReadClick');
        item.read = !item.read;
        this.calcShowMarkAllAsRead();

        // stopPropagation for not to trigger onNotificationItemClick
        btnEvent.event?.stopPropagation();

        this.itemReadClick.emit(item);
    }

    onGoToBtnClick(item: INotificationItem) {
        this.emitEvent({
            "Notification": {
                "NavigationPath": item.navigationPath
            }
        });
    }

    emitEvent(e: any): void {
        const eventData = {
            detail: {
                eventKey: 'PushNotificationReceived',
                // the data for the event
                eventData: e,
            },
        };
        const event = new CustomEvent('emit-event', eventData);
        window.dispatchEvent(event);
    }
}
