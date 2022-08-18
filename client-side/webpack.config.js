const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const filename = 'notifications'; // addon

const webpackConfig = withModuleFederationPlugin({
    name: filename,
    filename: `${filename}.js`,
    exposes: {
        // './NotificationBlockModule': './src/app/components/notification-block/index.ts',
        // './NotificationBlockEditorModule': './src/app/components/notification-block-editor/index.ts',
        // './DeviceManagmentModule': './src/app/components/device-managment/index.ts',
        // './NotificationsLogModule': './src/app/components/notifications-log/index.ts'
        './WebComponents': './src/bootstrap.ts',
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    }
});

module.exports = {
    ...webpackConfig,
    output: {
        ...webpackConfig.output,
        uniqueName: filename,
    },
};