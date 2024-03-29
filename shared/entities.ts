import { Schema } from 'jsonschema';
import { AddonData } from '@pepperi-addons/papi-sdk'
import { AddonUUID } from '../addon.config.json';

export const NOTIFICATIONS_TABLE_NAME = 'Notifications';
export const NOTIFICATIONS_LOGS_TABLE_NAME = 'NotificationsLogView';
export const USER_DEVICE_TABLE_NAME = 'UserDevice';
export const USERS_LISTS_TABLE_NAME = 'NotificationsUsersLists';
export const PFS_TABLE_NAME = 'PFSTable';
export const PLATFORM_APPLICATION_TABLE_NAME = 'PlatformApplication';
export const NOTIFICATIONS_VARS_TABLE_NAME = 'NotificationsVariables';
export const NOTIFICATION_SETUP_ELEMENT=`notifications-setup-element-${AddonUUID}`;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Notification {
    Title?: string,
    Body?: string,
    Key?: string,
    Hidden?: boolean,
    UserUUID?: string,
    UserEmail?: string,
    CreatorUserUUID?: string,
    CreatorName?: string,
    Read: boolean,
    NavigationPath?: string,
    Source?: "API" | "Webapp";
}

export interface BulkMessageObject {
    UsersUUID?: string[],
    SentTo: SentTo,
    Title: string,
    Body: string,
    ListKey?: string,
    SelectedGroupKey?: string,
    Read?: boolean
  } 

export interface PayloadData {
    Notification: Notification,
    Endpoint: string,
    DeviceType: string
    PlatformType: string
}

export interface NotificationLog extends AddonData {
    CreatorUUID: string,
    SentTo: SentTo,
    Title: string,
    Body?: string
    Key: string
}

export interface SentTo{
    Users: string[],
    Groups?: UsersGroup[]
}

export interface UsersGroup{
    Title: string,
    ListKey: string,
    SelectedGroupKey: string
}

export interface NotificationLogView extends NotificationLog {
    SentToUsers: string;
}

export interface FieldWithType {
    FieldName: string,
    Type: string
}

export interface UserDevice {
    UserUUID: string,
    Username: string,
    DeviceKey: string,
    DeviceName: string,
    DeviceType: string,
    AppKey: string,
    AppName: string,
    Token: string,
    Endpoint: string,
    Key: string,
    ExpirationDateTime: Date,
    PlatformType: string,
    LastRegistrationDate: Date
}

export interface UsersLists{
    Key: string;
    ListName: string;
    ResourceName: string;
    TitleField: string;
    MappingResourceName: string;
    UserReferenceField: string;
    ResourceReferenceField: string;
    SelectionDisplayFields: FieldWithType[];
    SmartSearchFields: FieldWithType[];
}
export interface notificationReadStatus{
    Read: boolean,
    Keys: string[]
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
        },
        NavigationPath: {
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
        Username: {
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

export const usersListsSchema: Schema = {
    $id: "/NotificationsUsersLists",
    type: "object",
    properties: {
        ListName: {
            type: "string",
            required: true
        },
        ResourceName: {
            type: "string",
            required: true
        },
        TitleField: {
            type: "string",
            required: true
        },
        MappingResourceName: {
            type: "string",
            required: true
        },
        UserReferenceField: {
            type: "string",
            required: true
        },
        ResourceReferenceField: {
            type: "string",
            required: true
        },
        SelectionDisplayFields: {
            type: "string[]",
            required: true
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