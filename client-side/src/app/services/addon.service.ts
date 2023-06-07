import { Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient, User } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { ComponentType } from '@angular/cdk/overlay';
import { PepDialogData, PepDialogService, PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';

import { PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';


@Injectable({ providedIn: 'root' })
export class AddonService {

    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;
    userUUID;
    dialogRef;
    users: Promise<any>;

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.session.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging: true
        })
    }

    constructor(
        public session: PepSessionService,
        private pepHttp: PepHttpService,
        private dialogService: PepDialogService
    ) {
        const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
        this.userUUID = this.parsedToken.sub;
        this.users = this.papiClient.users.find()
    }

    // Dialog service 
    openDialog(title: string, content: ComponentType<any>, buttons: Array<PepDialogActionButton>, input: any, callbackFunc?: (any) => void): void {
        const dialogConfig = this.dialogService.getDialogConfig({ disableClose: true, panelClass: 'pepperi-standalone' }, 'inline')
        const data = new PepDialogData({ title: title, actionsType: 'custom', content: content, actionButtons: buttons })
        dialogConfig.data = data;

        this.dialogRef = this.dialogService.openDialog(content, input, dialogConfig);
        if (callbackFunc) {
            this.dialogRef.afterClosed().subscribe(res => {
                callbackFunc(res);
            });
        }
    }

    openDefaultDialog(title: string, actionButtons: Array<PepDialogActionButton>, input: any): void {
        const dialogData = new PepDialogData({title:  title, content: input, actionsType: 'custom', actionButtons: actionButtons });
        this.dialogService.openDefaultDialog(dialogData)
          .afterClosed().subscribe(res => {
            if (typeof res === 'function') {
              res();
            }
          });
      }

    async getCurrentUserEmail() {
        return (await this.users).find(u => u.UUID == this.userUUID)?.Email
    }

    async getUserEmailByUUID(UUID: string){
        const user:User = (await this.users).find(u => u.UUID ==UUID);
        if (user != undefined) {
            return user.Email
        }
    }

    async get(endpoint: string): Promise<any> {
        return await this.papiClient.get(endpoint);
    }

    async post(endpoint: string, body: any): Promise<any> {
        return await this.papiClient.post(endpoint, body);
    }

    pepGet(endpoint: string): Observable<any> {
        return this.pepHttp.getPapiApiCall(endpoint);
    }

    pepPost(endpoint: string, body: any): Observable<any> {
        return this.pepHttp.postPapiApiCall(endpoint, body);

    }

}
