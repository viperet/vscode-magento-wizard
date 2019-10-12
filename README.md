# MagentoWizard README

This extension will ease life of the Magento 2 developer by automating some repeating tasks.

## Features

Creating new extension using `MagentoWizard: Create a new extension` command:

\!\[Creating new extension\]\(images/create_extension.gif\)

When you create new file (for example di.xml), extension provides handy default content for it. Works for some xml file, blocks, models, controllers, setup scripts, etc.

When editing class file you can inject new dependency by pressing `F1` and using `MagentoWizard: Inject Dependency` command.

### Planned features

- [x] Extension creation
- [x] Populating created *.php, *.xml, *.js files by template contents based on their name and location
- [x] Injecting dependencies
  - [ ] Better placement of the assignments
  - [ ] Autocomple classes/interfaces from the current extension
- [ ] Adding Observer
- [ ] Adding Plugin
- [ ] Adding route, controller, block, layout, template
- [ ] Adding custom attribute to products, categories, orders, customers, etc.
- [ ] More templates

## Release Notes

First public release of the extension

### 1.0.0

Initial release of MagentoWizard
