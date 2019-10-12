<?php
namespace {{ namespace }};

use Magento\Framework\Setup\InstallSchemaInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\SchemaSetupInterface;

class InstallSchema implements InstallSchemaInterface
{
    public function install(SchemaSetupInterface $setup, ModuleContextInterface $context)
    {
        $installer = $setup;

        $installer->startSetup();

        $table = $installer->getConnection()
            ->newTable($installer->getTable('table_name'))
            ->addColumn('entity_id', \Magento\Framework\DB\Ddl\Table::TYPE_INTEGER, null, ['identity' => true, 'unsigned' => true, 'nullable' => false, 'primary' => true], 'Description')
            ->addColumn('integer_field', \Magento\Framework\DB\Ddl\Table::TYPE_INTEGER, null, [], 'Description')
            ->addColumn('text_field', \Magento\Framework\DB\Ddl\Table::TYPE_TEXT, 20, [], 'Description')
            ->setComment('Table comment');
        $installer->getConnection()->createTable($table);

        $installer->endSetup();

    }
}
