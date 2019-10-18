<?php
namespace {{ namespace }};

class {{ name }} implements \Magento\Framework\Event\ObserverInterface
{
    public function __construct()
    {
    }

    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        {{#if data}}
        {{#each data}}
        /** @var \\{{this}} ${{@key}} */
        ${{@key}} = $observer->getData('{{@key}}');
        {{/each}}
        {{else}}
        $${1:myEventData} = $observer->getData('${1:myEventData}');$0
        {{/if}}
    }
}