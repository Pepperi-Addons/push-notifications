import { IPepChip } from "@pepperi-addons/ngx-lib/chips";
import { UsersLists } from "shared";
import { AddonService } from "src/app/services/addon.service";
import { NotificationsSetupService } from "src/app/services/notifications-setup.services";

export class UsersChipsGenerator {
    constructor(
        private addonService: AddonService,   
        private chipsComp: any
    ) {
    }

    async prepareChipsForUsersSelection(rlSelectionData: ResourceListOutputData): Promise<IPepChip[]> {
        let chips: IPepChip[] = [];

        // when isAllSelected is true, and the selectedObjects array is empty need to select all users
        // when the selectedObjects array is not empty, need to exclude the selected users from all users

        if (rlSelectionData.isAllSelected) {
            chips = await this.getAllUsersChips(rlSelectionData.selectedObjects);
        } else {
            chips = await this.getSelectedUsersChips(rlSelectionData.selectedObjects);
        }
        return chips;
    }

    private async getAllUsersChips(excludedUsersUUIDs: string[]): Promise<IPepChip[]> {
        const emails = await this.addonService.getAllUsers(excludedUsersUUIDs);
        let newChips: IPepChip[] = [];
        emails.forEach(email => {
            let chipObj = {
                value: email.Email,
                key: email.UUID
            }
            if (!this.chipsComp.chips.includes(chipObj)) {
                newChips.push(chipObj)
            }
        })
        return newChips;
    }

    private async getSelectedUsersChips(selectedUsersUUIDs: string[]): Promise<IPepChip[]> {
        let newChips: IPepChip[] = [];
        await Promise.all(selectedUsersUUIDs.map(async chip => {
            let chipObj = {
                value: await this.addonService.getUserEmailByUUID(chip),
                key: chip
            }
            if (!this.chipsComp.chips.includes(chipObj)) {
                newChips.push(chipObj)
            }
        }))
        return newChips;
    }
}
export class ListsChipsGenerator {

    constructor(
        private notificationsSetupService: NotificationsSetupService,
        private addonService: AddonService,
    ) {
    }
    async prepareChipsForListSelection(rlSelectionData: ResourceListOutputData, list: UsersLists): Promise<IPepChip[]> {
        let chips: IPepChip[] = [];

        // when isAllSelected is true, and the selectedObjects array is empty need to select all users
        // when the selectedObjects array is not empty, need to exclude the selected users from all users

        if (rlSelectionData.isAllSelected) {
            chips = await this.getAllListChips(rlSelectionData.selectedObjects, list);              
        } else {
            chips = await this.getSelectedListChips(rlSelectionData.selectedObjects, list);
        }
        return chips;
    }
    async getAllListChips(selectedListUUIDs: string[], list: UsersLists): Promise<IPepChip[]> {
        return await this.notificationsSetupService.getDisplayTitlesFromResource(list.TitleField, list.ResourceName, [], selectedListUUIDs)        

    }

    async getSelectedListChips(selectedListUUIDs: string[], list: UsersLists): Promise<IPepChip[]> {
       return await this.notificationsSetupService.getDisplayTitlesFromResource(list.TitleField, list.ResourceName, selectedListUUIDs)        
    }
}

export interface ResourceListOutputData {
    selectedObjects: string[];
    isAllSelected: boolean;
}