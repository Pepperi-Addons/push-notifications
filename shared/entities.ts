import { Schema } from 'jsonschema';
import { AddonData } from '@pepperi-addons/papi-sdk'

export const NOTIFICATIONS_TABLE_NAME = 'Notifications';
export const NOTIFICATIONS_LOGS_TABLE_NAME = 'NotificationsLogView';
export const USER_DEVICE_TABLE_NAME = 'UserDevice';
export const PFS_TABLE_NAME = 'UserDevice';
export const PLATFORM_APPLICATION_TABLE_NAME = 'PlatformApplication';
export const NOTIFICATIONS_VARS_TABLE_NAME = 'NotificationsVariables';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Notification {
    Title?: string,
    Body?: string,
    Key?: string,
    Hidden?: boolean,
    UserUUID?: string,
    UserEmail?: string,
    CreatorUserUUID?: string,
    Read: boolean
}

export interface NotificationLog extends AddonData {
    CreatorUUID: string,
    UsersList: string[],
    Title: string,
    Body?: string
    Key: string
}

export interface UserDevice {
    UserUUID: string,
    DeviceKey: string,
    DeviceName: string,
    DeviceType: string,
    AppKey: string,
    AppName: string,
    Token: string,
    Endpoint: string,
    Key: string,
    ExpirationDateTime: Date
}

export const notificationOnCreateSchema: Schema = {
    $id: "/Notification",
    type: "object",
    properties: {
        Title: {
            type: "string",
            maxLength: 40,
            required: true
        },
        Body: {
            type: "string",
            maxLength: 200,
        },
        UserUUID: {
            type: "string"
        },
        UserEmail: {
            type: "string"
        }
    },
    // UserEmail and UserUUID are mutually exclusive
    oneOf:
        [
            {
                $id: "UserUUID",
                type: "object",
                properties: {
                    UserUUID: {
                        type: "string",
                        required: true
                    }
                }
            },
            {
                $id: "UserEmail",
                type: "object",
                properties: {
                    UserEmail: {
                        type: "string",
                        required: true
                    }
                }
            }
        ],
    additionalProperties: false
}

export const notificationOnUpdateSchema: Schema = {
    $id: "/Notification",
    type: "object",
    properties: {
        Key: {
            type: "string",
            required: true
        },
        Hidden: {
            type: "boolean"
        },
        Read: {
            type: "boolean"
        }

    },
    "anyOf": [
        {
            $id: "Hidden",
            type: "object",
            properties: {
                Hidden: {
                    type: "boolean",
                    required: true
                }
            }
        },
        {
            $id: "Read",
            type: "object",
            properties: {
                Read: {
                    type: "boolean",
                    required: true
                }
            }
        }
    ],
    additionalProperties: false
}

export const userDeviceSchema: Schema = {
    $id: "/UserDevice",
    type: "object",
    properties: {
        UserUUID: {
            type: "string",
            required: false
        },
        AppKey: {
            type: "string",
            required: true
        },
        AppName: {
            type: "string",
            required: true
        },
        DeviceKey: {
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
        },
        PlatformType: {
            type: "string",
            required: true,
            enum: ["iOS", "Android", "Addon"]
        }
    }
}

export const platformApplicationsSchema: Schema = {
    $id: "/PlatformApplication",
    type: "object",
    properties: {
        Credential: {
            type: "string",
            required: true
        },
        AppKey: {
            type: "string",
            required: true
        },
        Type: {
            type: "string",
            required: true,
            enum: ["iOS", "Android", "Addon"]
        }
    }
}

export const platformApplicationsIOSSchema: Schema = {
    $id: "/PlatformApplication",
    type: "object",
    properties: {
        AppleSigningKeyID: {
            type: "string",
            required: true
        },
        AppleTeamID: {
            type: "string",
            required: true
        },
        BundleID: {
            type: "string",
            required: true
        }
    }
}

export const DEFAULT_NOTIFICATIONS_NUMBER_LIMITATION = {
    key: 'NOTIFICATIONS_NUMBER_LIMITATION',
    softValue: 600,
    hardValue: 2000
}

export const DEFAULT_NOTIFICATIONS_LIFETIME_LIMITATION = {
    key: 'NOTIFICATIONS_LIFETIME_LIMITATION',
    softValue: 30,
    hardValue: 60
}