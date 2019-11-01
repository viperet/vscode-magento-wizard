<?php
namespace {{ namespace }};

class {{ name }}
{
    public function __construct()
    {
    }
{{#ifEq pluginType 'before'}}
    public function {{pluginType}}{{capital method.name}}(
        \\{{className}} $subject{{#if method.parameters.length}},{{/if}}
        {{#each method.parameters}}
        {{#if type}}{{this.type}} {{/if}}${{this.name}}{{#if this.value}} = {{this.value}}{{/if}}{{#unless @last}},{{/unless}}
        {{/each}}
    ) {
        return [{{#each method.parameters}}${{this.name}}{{#unless @last}}, {{/unless}}{{/each}}];
    }
{{/ifEq }}{{#ifEq pluginType 'after'}}
    public function {{pluginType}}{{capital method.name}}(
        \\{{className}} $subject,
        $result{{#if method.parameters.length}},{{/if}}
        {{#each method.parameters}}
        {{#if type}}{{this.type}} {{/if}}${{this.name}}{{#if this.value}} = {{this.value}}{{/if}}{{#unless @last}},{{/unless}}
        {{/each}}
    ) {
        return $result;
    }
{{/ifEq }}{{#ifEq pluginType 'around'}}
    public function {{pluginType}}{{capital method.name}}(
        \\{{className}} $subject,
        callable $proceed{{#if method.parameters.length}},{{/if}}
        {{#each method.parameters}}
        {{#if type}}{{this.type}} {{/if}}${{this.name}}{{#if this.value}} = {{this.value}}{{/if}}{{#unless @last}},{{/unless}}
        {{/each}}
    ) {
        $result = $proceed({{#each method.parameters}}${{this.name}}{{#unless @last}}, {{/unless}}{{/each}});
        return $result;
    }
{{/ifEq }}
}
