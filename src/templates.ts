const templates: { [key: string]: string } = {
    'di\.xml$': require('../templates/di.xml'),
    'acl\.xml$': require('../templates/acl.xml'),
    'crontab\.xml$': require('../templates/crontab.xml'),
    'routes\.xml$': require('../templates/routes.xml'),
    '\/view\/(frontend|adminhtml)\/layout\/.*\.xml$': require('../templates/layout.xml'),
    '\/Block\/.*\.php$': require('../templates/block.php'),
    '\/Controller\/.*\.php$': require('../templates/controller.php'),
    '\/Model\/.*\.php$': require('../templates/model.php'),
    '\/Setup\/InstallData.php$': require('../templates/Setup/InstallData.php'),
    '\/Setup\/InstallSchema.php$': require('../templates/Setup/InstallSchema.php'),
    '\/Setup\/Recurring.php$': require('../templates/Setup/Recurring.php'),
    '\/Setup\/UpgradeData.php$': require('../templates/Setup/UpgradeData.php'),
    '\/Setup\/UpgradeSchema.php$': require('../templates/Setup/UpgradeSchema.php'),
};

export default templates;