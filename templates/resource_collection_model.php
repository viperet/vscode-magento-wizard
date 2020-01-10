<?php
namespace {{ namespace }};

class {{ name }} extends \Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection
{
    protected $_idFieldName = '${1:entity_id}';
	protected $_eventPrefix = '{{lower vendor}}_{{lower extension}}_{{snake modelName}}_collection';
	protected $_eventObject = '{{snake modelName }}_collection';

    /**
     * Define the resource model & the model.
     *
     * @return void
     */
    protected function _construct()
    {
        $this->_init('{{ vendor}}\\{{ extension }}\Model\\{{ modelName }}', '{{ vendor}}\\{{ extension }}\Model\ResourceModel\\{{ modelName }}');
    }
}
