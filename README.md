# MagentoWizard README

This extension will ease life of the Magento 2 developer by automating some repeating tasks.

## Features

- When you create new file (for example di.xml), extension provides handy default content for it. Works for some xml file, blocks, models, controllers, setup scripts, etc.
- Creating new extension using `MagentoWizard: Create a new extension` command:

![Creating new extension](https://github.com/viperet/vscode-magento-wizard/raw/master/images/create_extension.gif)

- When editing class file you can inject new dependency by pressing `F1` and using `MagentoWizard: Inject Dependency` command.

![Dependency Injection ](https://github.com/viperet/vscode-magento-wizard/raw/master/images/dependency-injection.gif)

- You can easily add observer for any event using "MagentoWizard: Add Observer" command, MagentoWizard even knows what data is passed to observers for some popular events.
- Ability to run all bin/magento commands using VSC Run Task command (Task provider can be disabled in the settings).
- Generation of [XML Catalog](https://en.wikipedia.org/wiki/XML_catalog) file for Magento 2 XML DTD files. Run `MagentoWizard: Generate XML Catalog` command and extension will create XML Catalog file in the correct format. It will be added to the [XML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) extension config if that extension is installed.

### Planned features

- [x] Extension creation
- [x] Populating created *.php, *.xml, *.js files by template contents based on their name and location
- [x] Injecting dependencies
  - [x] Better placement of the assignments
  - [x] Autocomple classes/interfaces from the current extension
  - [x] Autocomple classes/interfaces from 'vendor'
- [x] Adding Observer
- [x] Adding Plugin
- [ ] Adding Route, Controller, Block, Layout, Template
- [ ] Adding custom attribute to products, categories, orders, customers, etc.
- [x] Add Magento tasks like setup:upgrade, cache:clean to VSC tasks
- [ ] Watch for changes in *.xml, *.phtml, *.php and clear corresponding cache type (like [magento-cache-clean](https://github.com/mage2tv/magento-cache-clean) extension)
- [x] Go to definition function for class and template referrences in *.xml files
- [ ] More templates

## Release Notes

### 1.3.0

Added `MagentoWizard: Generate XML Catalog` command

### 1.2.2

Fixed bug in Plugin template.
Added Task Provider for bin/magento commands

### 1.2.0

Add Plugin command, easily add plugin (interceptor) for any public method.

### 1.1.4

Added support for extensions in /vendor. Added classes from current extension (including from /vendor) to list in
Inject Dependency command, removed duplicates from the list. Added caching of extension file data.
Improved Observer class name and DI variable name generation

### 1.1.3

Fixed bug in php templates. Added templates for catalog_attributes.xml, db_schema.xml, menu.xml, webapi.xml, console command.

### 1.1.2

Added generation of composer.json when creating new extension. Support for multiple worspace folders. Added classes from app/code/ to Inject dependency list.

### 1.1.1

New templates for config.xml, cron_groups.xml, systems.xml, sections.xml. Improved all templates with snippet placeholders.
Fixed bug which prevented from entering new vendor name. Improved commands.

### 1.1.0

Adding observers using "MagentoWizard: Add Observer" command

### 1.0.1

First public release of the extension
