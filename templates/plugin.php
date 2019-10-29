<?php
namespace {{ namespace }};

class {{ name }}
{
    public function __construct()
    {
    }

{{#ifEq pluginType 'before'}}
    public function {{pluginType}}{{capital metho.name}}(
        \\{{className}} $subject, 
        {{#each method.parameters}} 
        {{#if type}}{{this.type}} {{/if}}${{this.name}}{{#unless @last}},{{/unless}}
        {{/each}}
    ) {
        return [{{#each method.parameters}}${{this.name}}{{#unless @last}}, {{/unless}}{{/each}}];
    }
{{/ifEq }}
}
