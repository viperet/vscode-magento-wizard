<?php
namespace {{ namespace }};

class {{ name }}
{
    public function __construct()
    {
    }

{{#if typeName == 'before'}}
    public function {{pluginType}}{{capital methodName}}({{className}} $subject, ) {

    }
{{/if}}
}
