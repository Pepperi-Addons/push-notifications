import { Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { config } from 'src/app/addon.config';
import { INotificationItem } from './notifications.model';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

    private _items: INotificationItem[] = null
    @Input()
    set items(value: INotificationItem[]) {
       this._items = value?.length >= 0 ? value : null;
        //this._items = value?.length == 1 ? [] : null;
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
    showOnlyUnRead = false;
    flagSImageSRC = '';

    constructor(private pepAddonService: PepAddonService) { }

    ngOnInit() {
        this.flagSImageSRC = this.pepAddonService.getAddonStaticFolder(config.AddonUUID) + 'assets/images/Flags.png';
    }

    private calcShowMarkAllAsRead() {
        if(this._items){
            this.showMarkAllAsRead = this._items.some(item => !item.read);
        }
    }

    onMarkAllAsReadClick(btnEvent: IPepButtonClickEvent) {
        this._items.forEach(item => item.read = true);
        this.calcShowMarkAllAsRead();
        this.markAllAsReadClick.emit();
    }

    onMsgFilterClick(event){
        this.showOnlyUnRead = !this.showOnlyUnRead;
    }

    onNotificationItemClick(item: INotificationItem) {
        console.log('onNotificationItemClick');

        // Mark as read only if this notification is unread.
        if (!item.read) {
            item.read = true;
            this.calcShowMarkAllAsRead();
        }
        this.itemReadClick.emit(item);
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
