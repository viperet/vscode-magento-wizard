var config = {
    map: {
        '*': {
            '${1:scriptName}':'{{vendor}}_{{extension}}/js/scriptname'
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/model/shipping-save-processor/payload-extender': {
                '{{vendor}}_{{extension}}/js/model/shipping-save-processor/payload-extender-mixin': true
            }
        }
    }
};
