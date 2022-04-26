import { Schema } from 'jsonschema';

export const NOTIFICATIONS_TABLE_NAME = 'Notifications';

export interface Notification {
    Title: string,
    Body?: string,
    Key?: string,
    Hidden?: boolean,
    UserUUID: string,
    CreatorUserUUID: string
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
        UserUUID: {
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
    }
}

export const messageSchema: Schema = {
    $id: "/Message",
    type: "object",
    properties: {
        EmailsList: {
            type: "string[]",
            required: true
        },
        Title: {
            type: "string",
            required: true
        },
        Body: {
            type: "string",
            required: true
        }
    }
}
