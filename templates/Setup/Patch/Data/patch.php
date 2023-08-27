<?php
namespace {{ namespace }};

use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class {{ name }} implements DataPatchInterface
{
    /**
     * @var ModuleDataSetupInterface
     */
    private $moduleDataSetup;

    /**
     * @param ModuleDataSetupInterface $moduleDataSetup
     */
    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
    }

    /**
     * @inheritdoc
     */
    public function apply()
    {
        $this->moduleDataSetup->getConnection()->startSetup();
        //The code that you want apply in the patch
        //Please note, that one patch is responsible only for one setup version
        //So one UpgradeData can consist of few data patches
        $this->moduleDataSetup->getConnection()->endSetup();
    }

    /**
     * @inheritdoc
     */
    public static function getDependencies()
    {
        return [];
    }

    /**
     * @inheritdoc
     */
    public function getAliases()
    {
        return [];
    }
}
