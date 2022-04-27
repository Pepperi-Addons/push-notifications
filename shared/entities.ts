import { Schema } from 'jsonschema';

export const NOTIFICATIONS_TABLE_NAME = 'Notifications';
export const USER_DEVICE_TABLE_NAME = 'UserDevice';

export interface Notification {
    Title: string,
    Body?: string,
    Key?: string,
    Hidden?: boolean,
    UserUUID: string,
    Email?: string,
    CreatorUserUUID: string
}

export interface UserDevice {
    UserID: string,
    DeviceID: string,
    DeviceName: string,
    DeviceType: string,
    AppID: string,
    AppName: string,
    Token: string,
    Endpoint: string,
    Key: string,
    ExpirationDateTime: Date
}

export const notificationSchema: Schema = {
    $id: "/Notification",
    type: "object",
    properties: {
        Key: {
            type: "string"
        },
        Title: {
            type: "string"
        },
        Body: {
            type: "string"
        },
        CreatorUserUUID: {
            type: "string"
        },
        Read: {
            type: "boolean"
        },
        Hidden: {
            type: "boolean"
        },
        CreationDateTime: {
            type: "string",
            format: "date-time",
        },
        ModificationDateTime: {
            type: "string",
            format: "date-time",
        }
    },
    // Email and UserUUID are mutually exclusive
    oneOf:
        [
            {
                properties: {
                    UserUUID: {
                        type: "string",
                        required: true
                    }
                }
            },
            {
                properties: {
                    Email: {
                        type: "string",
                        required: true
                    }
                }
            }
        ]
}

export const userDeviceSchema: Schema = {
    $id: "/UserDevice",
    type: "object",
    properties: {
        UserID: {
            type: "string",
            required: false
        },
        AppID: {
            type: "string",
            required: true
        },
        AppName: {
            type: "string",
            required: true
        },
        DeviceID: {
            type: "string",
            required: true
        },
        DeviceName: {
            type: "string",
            required: true
        },
        DeviceType: {
            type: "string",
            required: true
        },
        Token: {
            type: "string",
            required: true
        }
    }
}
