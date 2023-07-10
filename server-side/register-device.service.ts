import { AddonData, PapiClient } from "@pepperi-addons/papi-sdk";
import { NotifiactionsSnsService } from "./notifications-sns.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import jwt from 'jwt-decode';
import * as encryption from 'shared'
import { USER_DEVICE_TABLE_NAME, UserDevice } from "shared";

abstract class EndpointStrategy {
    protected notificationsSnsService: NotifiactionsSnsService
    protected papiClient: PapiClient
    protected accessToken: string
    constructor(protected client: Client) {
        this.papiClient =  new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.accessToken = client.OAuthAccessToken;
        this.notificationsSnsService = new NotifiactionsSnsService(this.client)
    }

    abstract execute(body: any): any;
}

export class CreateEndpointStrategy extends EndpointStrategy{
    parsedToken: any = jwt(this.accessToken)
    currentUserUUID = this.parsedToken.sub;

    async execute(body: any) {
        
        body = await this.createApplicationEndpoint(body)

        return body
    }


    protected async createApplicationEndpoint(body){
        const pushNotificationsPlatform = body.PlatformType == "Android" ? "GCM" : "APNS";
        const awsID = process.env.AccountID;
        const region = process.env.AWS_REGION
        console.log("@@@awsID:", awsID);
        console.log("@@@region:", region);

        const appARN = `arn:aws:sns:${region}:${awsID}:app/${pushNotificationsPlatform}/${body.AppKey}`;

        let endpointARN = await this.notificationsSnsService.createApplicationEndpoint({
            AddonRelativeURL: body.AddonRelativeURL,
            PlatformType: body.PlatformType,
            PlatformApplicationArn: appARN,
            DeviceToken: body.Token
        });

        if(endpointARN){
            body.Endpoint = endpointARN
        }
        else{
            throw new Error("Failed to register user device")
        }

        return body
    }
}

export class UpdateEndpointStrategy extends EndpointStrategy{
    constructor(client: Client, private endpoint:string){
        super(client)
    }
    async execute(body: any) {
        console.log(`@@@Updating Endpoint attributes to endpoint ${this.endpoint} with token ${body.Token}`)
        await this.notificationsSnsService.updateEndpointAttributes(this.endpoint, body.Token)
        return body
    }
}

export class DeleteEndpointStrategy extends EndpointStrategy{
    async execute(body: any) {
        console.log(`@@@Deleting Endpoint ${body.Endpoint}`)
        await this.notificationsSnsService.deleteApplicationEndpoint(body.Endpoint)
        return body
    }
}

export class RecreateEndpointStrategy extends EndpointStrategy{

    constructor(client: Client, private oldKey:string){
        super(client)
    }

    async execute(body: any) {
        await this.notificationsSnsService.deleteApplicationEndpoint(this.oldKey)
        const createEndpointStrategy = new CreateEndpointStrategy(this.client)
        body = await createEndpointStrategy.execute(body)
        return body
    }
}

export class UserDeviceHandlingFactory{
    userDevices: UserDevice[] = []
    papiClient: PapiClient
    addonSecretKey: string
    addonUUID: string
    constructor(private client: Client, private newUserDeviceData:any){
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.addonUUID = client.AddonUUID;
        this.addonSecretKey = client.AddonSecretKey ?? "";
    }

    async getUserDevices(){
        const userDevice = await this.papiClient.addons.data.uuid(this.addonUUID).table(USER_DEVICE_TABLE_NAME).find({ where: `Key='${this.newUserDeviceData.Key}'` }) as AddonData
        this.userDevices = userDevice as UserDevice[]
    }

    async getStrategy(): Promise<CreateEndpointStrategy | RecreateEndpointStrategy | UpdateEndpointStrategy>{
        await this.getUserDevices()
        let strategy
        if(await this.isDeviceExist()){
            if(await this.isTokenChanged){
                // if there is a new token, then update the endpoint with the old token
                strategy = new UpdateEndpointStrategy(this.client, this.userDevices[0].Endpoint);
            }
            else if (await this.isDeviceKeyChanged()){
                // if key exists old endpoint need to be removed and recreated
                strategy = new RecreateEndpointStrategy(this.client, this.userDevices[0].Key)
            }
            else{
                // default if no key and token changed but device exists
                strategy = new CreateEndpointStrategy(this.client)
            }
        }
        else{
            // if device not exists then create a new device
            strategy = new CreateEndpointStrategy(this.client)
        }
        return strategy
    }
    
    private async isTokenChanged(): Promise<boolean>{
        // isTokenChanged() - UpdateEndpointStrategy
        const userDeviceToken = await encryption.decryptSecretKey(this.userDevices[0].Token, this.addonSecretKey)
        if (this.newUserDeviceData.Token != userDeviceToken){
            return true
        }
        else{
            return false
        }
    } 

    private async isDeviceKeyChanged(): Promise<boolean>{
        // isDeviceKeyChanged() - RecreateEndpointStrategy
        if(this.newUserDeviceData.Key != this.userDevices[0].Key){
            return true
        }
        else{
            return false
        }
        
    }

    private async isDeviceExist(): Promise<boolean>{
        // isDeviceExist() - CreateEndpointStrategy
        if(this.userDevices.length != 0){
            return true
        }
        else{
            return false
        }
    }    
}
