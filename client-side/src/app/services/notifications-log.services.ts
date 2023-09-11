import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { config } from '../addon.config';
import { AddonService } from './addon.service';
import { NotificationLogView } from 'shared';
// import { IPepListSortingData } from '@pepperi-addons/ngx-lib/list';

@Injectable({
    providedIn: 'root'
})

export class NotificationsLogService {
    constructor(
        private addonService: AddonService,
        private route: ActivatedRoute
    ) {
        this.addonService.addonUUID = config.AddonUUID;
    }

    async getNotificationLogByKey(key: string){
        const url = `/addons/api/${this.addonService.addonUUID}/api/notifications_log_by_key?Key=${key}`
        return await this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    getNotificationsLog() {
        const url = `/addons/api/${this.addonService.addonUUID}/api/notifications_log`
        return this.addonService.pepGet(encodeURI(url)).toPromise();
    }

    async getNotificationsLogView() {
        const url = `/addons/api/${this.addonService.addonUUID}/api/notifications_log`
        const logs = await this.addonService.pepGet(encodeURI(url)).toPromise() as NotificationLogView[]
        logs.forEach(log => {
            const sentToUsers = log.SentTo.Users
            const sentToGroups = log.SentTo.Groups?.map(groupData => {return groupData.Title}) || []
            // concat the users and groups to one array, sentToUsers or sentToGroups may be undefined or empty
            const sentTo = sentToUsers ? sentToUsers.concat(sentToGroups) : sentToGroups
            // create from the array a string with comma separated values
            log.SentToUsers = sentTo.join(', ')
            // delete the log.SentToGroups property
            delete log.SentTo.Groups
        }) 
        return logs
    }

    deleteNotificationsLog(notifications) {
        return this.addonService.pepPost(`/addons/api/${this.addonService.addonUUID}/api/delete_notifications_log`, notifications).toPromise()
    }

    formatDateTime(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };  
        return new Intl.DateTimeFormat('en', options).format(date);
    }

    handleSorting(params: any, notificationsList: any) {
        if (params.sorting) {
            notificationsList = this.sortList(notificationsList, params.sorting);          
        } else { // Default sorting - sort by date
            notificationsList = this.sortList(notificationsList, {
                sortBy: 'Date',
                isAsc: false
            });
        }
    }
    
        
    private sortList(list: any[], sorting: any) {
        const { sortBy, isAsc } = sorting;
        
        const compareStrings = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });
        const compareValues = (a: any, b: any) => (typeof a === 'string' && typeof b === 'string') ? compareStrings(a, b) : a - b;
        
        list.sort((itemA, itemB) => {
            if (sortBy === 'Date') { // Sort by date
                const dateA = new Date(itemA.CreationDateTime).getTime();
                const dateB = new Date(itemB.CreationDateTime).getTime();
                return isAsc ? dateA - dateB : dateB - dateA;
            } else {
                return isAsc ? compareValues(itemA[sortBy], itemB[sortBy]) : compareValues(itemB[sortBy], itemA[sortBy]);
            }
        });
        
        return list;
    }
}