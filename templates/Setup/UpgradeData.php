<?php
namespace {{ namespace }};

use Magento\Eav\Setup\EavSetup;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\UpgradeDataInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\ModuleDataSetupInterface;

class UpgradeData implements UpgradeDataInterface
{
    private $eavSetupFactory;

    public function __construct(EavSetupFactory $eavSetupFactory)
    {
        $this->eavSetupFactory = $eavSetupFactory;
    }

    public function upgrade(ModuleDataSetupInterface $setup, ModuleContextInterface $context)
    {
        $setup->startSetup();

        if ($context->getVersion() && version_compare($context->getVersion(), '1.0.1') < 0) {

            $eavSetup = $this->eavSetupFactory->create(['setup' => $setup]);
            $eavSetup->addAttribute(
                \Magento\Catalog\Model\Product::ENTITY,
                'attribute_name1',
                [
                    'type' => 'decimal',
                    'backend' => '',
                    'frontend' => '',
                    'label' => 'Label',
                    'input' => 'text',
                    'class' => '',
                    'source' => '',
                    'global' => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                    'visible' => true,
                    'required' => false,
                    'user_defined' => true,
                    'default' => '',
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'visible_on_front' => false,
                    'used_in_product_listing' => true,
                    'unique' => false,
                    'apply_to' => 'simple',
                ]
            );

            $eavSetup->addAttribute(
                \Magento\Catalog\Model\Category::ENTITY,
                'attribute_name2',
                [
                    'type'         => 'decimal',
                    'label'        => 'Label',
                    'input'        => 'text',
                    'sort_order'   => 100,
                    'source'       => '',
                    'global'       => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                    'visible'      => true,
                    'required'     => false,
                    'user_defined' => false,
                    'default'      => null,
                    'group'        => '',
                    'backend'      => ''
                ]
            );
        }
        $setup->endSetup();
    }
}