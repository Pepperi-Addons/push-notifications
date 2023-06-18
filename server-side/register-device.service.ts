import { PapiClient } from "@pepperi-addons/papi-sdk";
import { NotifiactionsSnsService } from "./notifications-sns.service";
import { Client } from "@pepperi-addons/debug-server/dist";
import jwt from 'jwt-decode';
import * as encryption from 'shared'

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
        this.notificationsSnsService = new NotifiactionsSnsService(this.papiClient)
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
    async execute(body: any) {
        await this.notificationsSnsService.updateEndpointAttributes(body.Endpoint, body.Token)
        return body
    }
}

export class DeleteEndpointStrategy extends EndpointStrategy{
    async execute(body: any) {
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
