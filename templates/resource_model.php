<?php
namespace {{ namespace }};

class {{ name }} extends \Magento\Framework\Model\ResourceModel\Db\AbstractDb
{
    public function __construct(
        \Magento\Framework\Model\ResourceModel\Db\Context $context
    )
    {
        parent::__construct($context);
    }

    protected function _construct()
    {
        $this->_init('${1:table_name}', '${2:entity_id}');
    }
}
