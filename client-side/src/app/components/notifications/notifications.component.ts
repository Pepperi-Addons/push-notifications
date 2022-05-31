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

    ngOnInit() {
        const now = new Date();

        // Example.
        this.items = [{
            key: '1',
            date: new Date(now.setHours(now.getHours() - 4)),
            read: false,
            title: 'Late 2022 catalog is live!',
            body: 'Please notice that the new catalog for 2022 Q4 is now live, you can see it in the order center. Also available is our new Provider Data Catalog which makes it much easier to search and download stuff.',
            to: 'Bunsen Honeydew'
        }, {
            key: '2',
            date: new Date(now.setHours(now.getHours() - 8)),
            read: false,
            title: 'Get them all',
            goToActivityName: 'activity'
        }, {
            key: '3',
            date: new Date(now.getFullYear(), now.getMonth(), now.getDay() - 1),
            read: false,
            title: 'Get if ready fop passover',
            body: 'Block shelfs from Chametz now that Passover is coming ',
            to: 'Miss Piggy',
        },
        {
            key: '1',
            date: new Date(now.setHours(now.getHours() - 4)),
            read: false,
            title: 'Late 2022 catalog is live!',
            body: 'Please notice that the new catalog for 2022 Q4 is now live, you can see it in the order center. Also available is our new Provider Data Catalog which makes it much easier to search and download stuff.',
            to: 'Bunsen Honeydew'
        }, {
            key: '2',
            date: new Date(now.setHours(now.getHours() - 8)),
            read: false,
            title: 'Get them all',
            goToActivityName: 'activity'
        }, {
            key: '3',
            date: new Date(now.getFullYear(), now.getMonth(), now.getDay() - 1),
            read: false,
            title: 'Get if ready fop passover',
            body: 'Block shelfs from Chametz now that Passover is coming ',
            to: 'Miss Piggy',
        },{
            key: '1',
            date: new Date(now.setHours(now.getHours() - 4)),
            read: false,
            title: 'Late 2022 catalog is live!',
            body: 'Please notice that the new catalog for 2022 Q4 is now live, you can see it in the order center. Also available is our new Provider Data Catalog which makes it much easier to search and download stuff.',
            to: 'Bunsen Honeydew'
        }, {
            key: '2',
            date: new Date(now.setHours(now.getHours() - 8)),
            read: false,
            title: 'Get them all',
            goToActivityName: 'activity'
        }, {
            key: '3',
            date: new Date(now.getFullYear(), now.getMonth(), now.getDay() - 1),
            read: false,
            title: 'Get if ready fop passover',
            body: 'Block shelfs from Chametz now that Passover is coming ',
            to: 'Miss Piggy',
        }]
    }

    private calcShowMarkAllAsRead() {
        this.showMarkAllAsRead = this._items.some(item => !item.read);
    }

    onMarkAllAsReadClick(btnEvent: IPepButtonClickEvent) {
        console.log('onMarkAllAsReadClick');
        this._items.forEach(item => item.read = true);
        this.calcShowMarkAllAsRead();
        this.markAllAsReadClick.emit();
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

}
