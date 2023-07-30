import { MatDialogRef } from "@angular/material/dialog";
import { PepDialogService } from "@pepperi-addons/ngx-lib/dialog";

export class NotificationsDialogService{
    constructor(protected dialogService: PepDialogService){

    }
    openDialog(comp: any, callBack, data = {}){
        let config = this.dialogService.getDialogConfig({}, 'inline');
            config.disableClose = false;
            config.height = '80%'; // THE EDIT MODAL WIDTH
            config.width = '50%'; // THE EDIT MODAL WIDTH

        let dialogRef: MatDialogRef<any> = this.dialogService.openDialog(comp, data, config);
    
        dialogRef.afterClosed().subscribe((value) => {
            if (value !== undefined && value !== null) {
                callBack(value);
            }
        });
    }
}