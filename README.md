# MagentoWizard

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/viperet.vscode-magento-wizard)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/viperet.vscode-magento-wizard)
![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/viperet.vscode-magento-wizard)
![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/viperet.vscode-magento-wizard)
![Visual Studio Marketplace Rating (Stars)](https://img.shields.io/visual-studio-marketplace/stars/viperet.vscode-magento-wizard)

This extension will ease life of the Magento 2 developer by automating some repeating tasks.

## Features

- When you create a new file (for example di.xml), extension provides handy default content for it. Works for some xml files, blocks, models, controllers, setup scripts, etc.
- Creating a new extension using `MagentoWizard: Create a new extension` command:

![Creating new extension](https://github.com/viperet/vscode-magento-wizard/raw/master/images/create_extension.gif)

- When editing a class file you can inject new dependency by pressing `F1` and using `MagentoWizard: Inject Dependency` command.
Start typing `\Vendor\ExtensionName\` to get a list of classes from that extension.

![Dependency Injection ](https://github.com/viperet/vscode-magento-wizard/raw/master/images/dependency-injection.gif)

- You can easily add observer for any event using `MagentoWizard: Add Observer` command, MagentoWizard even knows what data is passed to observers for some popular events.
- Use `MagentoWizard: Add CRUD Model/ResourceModel/Collection` to create all classes needed to access Model data in DB.
- Ability to run all bin/magento commands using VSC Run Task command (Task provider can be disabled in the settings).
- Generation of [XML Catalog](https://en.wikipedia.org/wiki/XML_catalog) file for Magento 2 XML DTD files. Run `MagentoWizard: Generate XML Catalog` command and extension will create XML Catalog file in the correct format. It will be added to the [XML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) extension config if that extension is installed.
- `Go to Definition` function for class names and template names in XML Layouts.
- Autocompletion of the class and template names in XML layouts and configurations. More autocompletions would be added soon, stay tuned.

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

## Contributions

This project is open for all kinds of contributions - new templates, new ideas, bug reports, new features, etc.
If you found a bug or want to request a new feature - just create a new issue on github. If you want to add a new feature yourself -
fork this repo and create a pull request.

## Release Notes

### 2.4.0

Autocompletion of the block names in XML layouts.

### 2.3.0

Autocompletion of the class and template names in XML layouts and configurations.

### 2.2.0

Added command to reindex workspace (ignoring cached data)

### 2.1.0

Added templates for CRUD Model, ResourceModel, Collection. New command to create those classes automatically.

### 2.0.0

Big update of the inner design of extension. Now MagentoWizard indexes all extentions, themes, libraries in the workspace after the launch
and keeps index up to date by watching changes in the files. That allows to support autodetection of the Magento root in the workspace, also
Magento Wizard now better supports many Magento roots in different workspace folders, also you can override location of the Magento root in settings.
Also support for `Go to Defintion` function for class names and templates in XML layout files was added.

### 1.3.2

Added option to select the existing XML file to convert when using the 'Generate Catalog' command.

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
