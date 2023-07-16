import { Client } from '@pepperi-addons/debug-server/dist';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import AWS, { SNS } from 'aws-sdk';
import { SetEndpointAttributesInput } from 'aws-sdk/clients/sns';

export class NotifiactionsSnsService{
    sns: SNS;
    papiClient: PapiClient

    constructor(client: Client){
        this.papiClient =  new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.sns = new AWS.SNS();
    }

    async createApplicationEndpoint(body) {
        switch (body.PlatformType) {
            case "Addon":
                return body.AddonRelativeURL;
            default:
                console.log("@@@createApplicationEndpoint: body :", body);
                const params = {
                    PlatformApplicationArn: body.PlatformApplicationArn,
                    Token: body.DeviceToken
                };
                const Endpoint = await this.sns.createPlatformEndpoint(params).promise();
                console.log("@@@Endpoint:", Endpoint);
                return Endpoint.EndpointArn;
        }
    }

    async updateEndpointAttributes(endpoint: string, token:string){
        const attr:SetEndpointAttributesInput = {
            EndpointArn:endpoint,
            Attributes: { Enabled: 'true', Token: token }
        }
        await this.sns.setEndpointAttributes(attr).promise()
    }

    async deleteApplicationEndpoint(endpointARN) {
        const params = {
            EndpointArn: endpointARN
        };
        return await this.sns.deleteEndpoint(params).promise();
    }


    async deleteApplication(platformArn) {
        const params = {
            PlatformApplicationArn: platformArn
        };
        return await this.sns.deletePlatformApplication(params).promise();
    }

    async createPlatformApplication(params){
        return await this.sns.createPlatformApplication(params).promise()
    }

    async publishPushNotifiaction(notification){
        return await this.sns.publish(notification).promise();
    }
}