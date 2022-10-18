# Push Notification

Push notifications are clickable pop-up messages of information from a software application that appear on the users' mobile without a specific request from the user.
In Notifications addon we also have a notifications screen that shows all the messages from the last 30 days.

# Addon Purpose

We want to enable our clients to send push notifications to their users.
The notification object can be related to a user in multiple ways:
* Activity that the user is a part of 
* Direct message to user 
* Broadcast notifications 
The notifications is supported for both Pepperi app and private label apps and can be sent from both  the api and managment addon screen.

# Key Implementation Details 

* SNS Service :

We use Amazon SNS Push Notification - A Service that give us the ability to send push notification messages directly to apps on mobile devices.
In order to send notification we need to:
1. Create 'Platform applications' for the app. for the Pepperi App we are create this platform application and for label apps the admins are responsible for creating this platform app(we have api calls for this).
2. Create an 'Endpoint' for each device that a user logs in to and has also confirmed receipt of notifications(we do it automatically in our native apps).

* DIMX Service:

We use this service when notifications are sent to several users at the same time - we create notifications in ADAL and with the help of PNS the notifications sent to the devices.

* PNS Service:

We use this service in many places, for example:
1. When a notification is created in ADAL we use PNS to call the SNS 'Publish' func in order to send the notifications to the devices.
2. When a device id removed from ADAL (can be from the addon UI or because the user logged out from the app), it use the PNS to remove the endpoint from the SNS service when its expiration date is arrvied. 
3. When a platform application is removed, it also use the PNS to remove the Platform application from the SNS service when its expiration date is arrvied. 

* CPI- Node Service:

We use cpi-node for sync the app everytime a user click on notification pop-up and there is NavigationPath related to the notification object.
We also use cpi-node slugs in order to navigate to the related screen when the notification pop-up clicked.

# Future Plans:

* There is a branch with the implementation of using chips and a resource list, which changes the way of choosing users to send messages (branch name: v 1.1)
* 

#### System Requirements
`cpi node --version` > 1.0.6
`pfs --version` > 1.0.2
`dimx --version` > 0.0.177
