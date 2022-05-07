interface EventDescription {
    /**
     * Description of the event
     *
     * @type {string}
     * @memberof EventDescription
     */
    description?: string;
    /**
     * Possible event data payload and it's type
     *
     * @type {{ [dataName: string]: string }}
     * @memberof EventDescription
     */
    data: { [dataName: string]: string };
}
const classList: {[eventName: string]: EventDescription } = {
    "abstract_search_result_load_after": {
        "description": "",
        "data": {
            "collection": "\\Magento\\CatalogInventory\\Model\\ResourceModel\\Stock\\Status\\Collection"
        }
    },
    "abstract_search_result_load_before": {
        "description": "",
        "data": {
            "collection": "\\Magento\\CatalogInventory\\Model\\ResourceModel\\Stock\\Status\\Collection"
        }
    },
    "admin_user_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\User\\Model\\User",
            "object": "\\Magento\\User\\Model\\User"
        }
    },
    "admin_user_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\User\\Model\\User",
            "field": "mixed",
            "value": "string",
            "data_object": "\\Magento\\User\\Model\\User"
        }
    },
    "adminhtml_block_html_before": {
        "description": "",
        "data": {
            "block": "\\Magento\\Backend\\Block\\Template"
        }
    },
    "adminhtml_catalog_category_tree_can_add_root_category": {
        "description": "",
        "data": {
            "category": "\\Magento\\Catalog\\Model\\Category",
            "options": "\\Magento\\Framework\\DataObject",
            "store": "string"
        }
    },
    "adminhtml_catalog_category_tree_can_add_sub_category": {
        "description": "",
        "data": {
            "category": "\\Magento\\Catalog\\Model\\Category",
            "options": "\\Magento\\Framework\\DataObject",
            "store": "string"
        }
    },
    "backend_block_widget_grid_prepare_grid_before": {
        "description": "",
        "data": {
            "grid": "\\Magento\\Backend\\Block\\Dashboard\\Tab\\Products\\Ordered",
            "collection": "mixed"
        }
    },
    "catalog_block_product_list_collection": {
        "description": "",
        "data": {
            "collection": "\\Magento\\CatalogSearch\\Model\\ResourceModel\\Fulltext\\Collection"
        }
    },
    "catalog_block_product_status_display": {
        "description": "",
        "data": {
            "status": "\\Magento\\Framework\\DataObject"
        }
    },
    "catalog_category_collection_add_is_active_filter": {
        "description": "",
        "data": {
            "category_collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Category\\Collection"
        }
    },
    "catalog_category_collection_load_after": {
        "description": "",
        "data": {
            "category_collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Category\\Collection"
        }
    },
    "catalog_category_collection_load_before": {
        "description": "",
        "data": {
            "category_collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Category\\Collection"
        }
    },
    "catalog_category_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Catalog\\Model\\Category",
            "category": "\\Magento\\Catalog\\Model\\Category"
        }
    },
    "catalog_controller_product_init_after": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "controller_action": "\\Magento\\Catalog\\Controller\\Product\\View"
        }
    },
    "catalog_controller_product_init_before": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Product\\View",
            "params": "\\Magento\\Framework\\DataObject"
        }
    },
    "catalog_controller_product_view": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product"
        }
    },
    "catalog_entity_attribute_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Catalog\\Model\\ResourceModel\\Eav\\Attribute",
            "attribute": "\\Magento\\Catalog\\Model\\ResourceModel\\Eav\\Attribute"
        }
    },
    "catalog_product_collection_apply_limitations_after": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Product\\Link\\Product\\Collection"
        }
    },
    "catalog_product_collection_load_after": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Product\\Collection"
        }
    },
    "catalog_product_get_final_price": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "qty": "mixed"
        }
    },
    "catalog_product_is_salable_after": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "salable": "\\Magento\\Framework\\DataObject"
        }
    },
    "catalog_product_is_salable_before": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product"
        }
    },
    "catalog_product_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Catalog\\Model\\Product",
            "product": "\\Magento\\Catalog\\Model\\Product"
        }
    },
    "catalog_product_upsell": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Product\\Link\\Product\\Collection",
            "limit": "mixed"
        }
    },
    "checkout_allow_guest": {
        "description": "",
        "data": {
            "quote": "\\Magento\\Quote\\Model\\Quote",
            "store": "integer",
            "result": "\\Magento\\Framework\\DataObject"
        }
    },
    "checkout_cart_product_add_after": {
        "description": "Dispatched after product was added to the cart",
        "data": {
            "quote_item": "\\Magento\\Quote\\Model\\Quote\\Item",
            "product": "\\Magento\\Catalog\\Model\\Product",
        }
    },
    "checkout_onepage_controller_success_action": {
        "description": "",
        "data": {
            "order_ids": "array"
        }
    },
    "checkout_quote_destroy": {
        "description": "",
        "data": {
            "quote": "\\Magento\\Quote\\Model\\Quote"
        }
    },
    "checkout_quote_init": {
        "description": "",
        "data": {
            "quote": "\\Magento\\Quote\\Model\\Quote"
        }
    },
    "clean_cache_by_tags": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "cms_block_collection_load_after": {
        "description": "",
        "data": {
            "block_collection": "\\Magento\\Cms\\Model\\ResourceModel\\Block\\Collection"
        }
    },
    "cms_block_collection_load_before": {
        "description": "",
        "data": {
            "block_collection": "\\Magento\\Cms\\Model\\ResourceModel\\Block\\Collection"
        }
    },
    "cms_page_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Cms\\Model\\Page",
            "object": "\\Magento\\Cms\\Model\\Page"
        }
    },
    "cms_page_render": {
        "description": "",
        "data": {
            "page": "\\Magento\\Cms\\Model\\Page",
            "controller_action": "\\Magento\\Cms\\Controller\\Page\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http\\Proxy"
        }
    },
    "controller_action_layout_render_before": {
        "description": "",
        "data": {}
    },
    "controller_action_layout_render_before_catalogsearch_result_index": {
        "description": "",
        "data": {}
    },
    "controller_action_postdispatch": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_adminhtml": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\Auth\\Login",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_adminhtml_auth_login": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\Auth\\Login",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_catalog": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_catalog_category_edit": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_catalog_product_view": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Product\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_checkout": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Onepage\\Success",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_checkout_cart_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Cart\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_checkout_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_checkout_onepage_success": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Onepage\\Success",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_cms": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Page\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_cms_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_cms_page_view": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Page\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_contact": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Contact\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_contact_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Contact\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_review": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_postdispatch_review_product_listAjax": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_noroute": {
        "description": "",
        "data": {
            "action": "\\Magento\Framework\Controller\Noroute\\Index",
            "status": "\\Magento\\Framework\\DataObject"
        }
    },
    "controller_action_predispatch": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Ui\\Controller\\Adminhtml\\Index\\Render",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_adminhtml": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\Dashboard\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_adminhtml_auth_login": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\Auth\\Login",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_adminhtml_dashboard_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\Dashboard\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_adminhtml_system_account_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Backend\\Controller\\Adminhtml\\System\\Account\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalog": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Edit",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalog_category_edit": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Edit",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalog_category_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Adminhtml\\Category\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalog_product_view": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Catalog\\Controller\\Product\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalogsearch": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\CatalogSearch\\Controller\\Result\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_catalogsearch_result_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\CatalogSearch\\Controller\\Result\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_checkout": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Onepage\\Success",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_checkout_cart_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Cart\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_checkout_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_checkout_onepage_success": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Checkout\\Controller\\Onepage\\Success",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_cms": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Page\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_cms_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_cms_page_view": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Cms\\Controller\\Page\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_contact": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Contact\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_contact_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Contact\\Controller\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_customer": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Customer\\Controller\\Adminhtml\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_customer_index_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Customer\\Controller\\Adminhtml\\Index\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_customer_section_load": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Customer\\Controller\\Section\\Load",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_mui": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Ui\\Controller\\Adminhtml\\Index\\Render",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_mui_index_render": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Ui\\Controller\\Adminhtml\\Index\\Render",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_review": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_review_product_listAjax": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_sales": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Sales\\Controller\\Adminhtml\\Order\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_sales_order_index": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Sales\\Controller\\Adminhtml\\Order\\Index",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_action_predispatch_sales_order_view": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Sales\\Controller\\Adminhtml\\Order\\View",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "controller_front_send_response_before": {
        "description": "",
        "data": {
            "request": "\\Magento\\Framework\\App\\Request\\Http",
            "response": "\\Magento\\Framework\\App\\Response\\Http"
        }
    },
    "core_abstract_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Ui\\Model\\Bookmark",
            "object": "\\Magento\\Ui\\Model\\Bookmark"
        }
    },
    "core_abstract_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Ui\\Model\\Bookmark",
            "field": "mixed",
            "value": "string",
            "data_object": "\\Magento\\Ui\\Model\\Bookmark"
        }
    },
    "core_abstract_save_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Security\\Model\\AdminSessionInfo",
            "object": "\\Magento\\Security\\Model\\AdminSessionInfo"
        }
    },
    "core_abstract_save_before": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Security\\Model\\AdminSessionInfo",
            "object": "\\Magento\\Security\\Model\\AdminSessionInfo"
        }
    },
    "core_abstract_save_commit_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Security\\Model\\AdminSessionInfo",
            "object": "\\Magento\\Security\\Model\\AdminSessionInfo"
        }
    },
    "core_collection_abstract_load_after": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Ui\\Model\\ResourceModel\\Bookmark\\Collection"
        }
    },
    "core_collection_abstract_load_before": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Ui\\Model\\ResourceModel\\Bookmark\\Collection"
        }
    },
    "core_layout_block_create_after": {
        "description": "",
        "data": {
            "block": "\\Magento\\Ui\\Block\\Logger"
        }
    },
    "core_layout_render_element": {
        "description": "",
        "data": {
            "element_name": "string",
            "layout": "\\Magento\\Framework\\View\\Layout",
            "transport": "\\Magento\\Framework\\DataObject"
        }
    },
    "currency_display_options_forming": {
        "description": "",
        "data": {
            "currency_options": "\\Magento\\Framework\\DataObject",
            "base_code": "string"
        }
    },
    "custom_quote_process": {
        "description": "",
        "data": {
            "checkout_session": "\\Magento\\Checkout\\Model\\Session"
        }
    },
    "customer_entity_attribute_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Customer\\Model\\Attribute",
            "attribute": "\\Magento\\Customer\\Model\\Attribute"
        }
    },
    "customer_group_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Customer\\Model\\Group",
            "object": "\\Magento\\Customer\\Model\\Group"
        }
    },
    "customer_group_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Customer\\Model\\Group",
            "field": "mixed",
            "value": "integer",
            "data_object": "\\Magento\\Customer\\Model\\Group"
        }
    },
    "customer_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Customer\\Model\\Customer",
            "field": "mixed",
            "value": "mixed",
            "data_object": "\\Magento\\Customer\\Model\\Customer",
            "customer": "\\Magento\\Customer\\Model\\Customer"
        }
    },
    "customer_session_init": {
        "description": "",
        "data": {
            "customer_session": "\\Magento\\Customer\\Model\\Session"
        }
    },
    "eav_collection_abstract_load_before": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Category\\Collection"
        }
    },
    "entity_manager_load_after": {
        "description": "",
        "data": {
            "entity_type": "string",
            "entity": "\\Magento\\Catalog\\Model\\Category",
            "arguments": "array"
        }
    },
    "entity_manager_load_before": {
        "description": "",
        "data": {
            "entity_type": "string",
            "identifier": "integer",
            "arguments": "array"
        }
    },
    "indexer_state_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Indexer\\Model\\Indexer\\State",
            "indexer_state": "\\Magento\\Indexer\\Model\\Indexer\\State"
        }
    },
    "indexer_state_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Indexer\\Model\\Indexer\\State",
            "field": "string",
            "value": "string",
            "data_object": "\\Magento\\Indexer\\Model\\Indexer\\State",
            "indexer_state": "\\Magento\\Indexer\\Model\\Indexer\\State"
        }
    },
    "items_additional_data": {
        "description": "",
        "data": {
            "item": "\\Magento\\Quote\\Model\\Quote\\Item"
        }
    },
    "layout_generate_blocks_after": {
        "description": "",
        "data": {
            "full_action_name": "string",
            "layout": "\\Magento\\Framework\\View\\Layout"
        }
    },
    "layout_generate_blocks_before": {
        "description": "",
        "data": {
            "full_action_name": "string",
            "layout": "\\Magento\\Framework\\View\\Layout"
        }
    },
    "layout_load_before": {
        "description": "",
        "data": {
            "full_action_name": "string",
            "layout": "\\Magento\\Framework\\View\\Layout"
        }
    },
    "layout_render_before": {
        "description": "",
        "data": {}
    },
    "layout_render_before_adminhtml_auth_login": {
        "description": "",
        "data": {}
    },
    "layout_render_before_catalog_product_view": {
        "description": "",
        "data": {}
    },
    "layout_render_before_catalogsearch_result_index": {
        "description": "",
        "data": {}
    },
    "layout_render_before_checkout_cart_index": {
        "description": "",
        "data": {}
    },
    "layout_render_before_checkout_index_index": {
        "description": "",
        "data": {}
    },
    "layout_render_before_checkout_onepage_success": {
        "description": "",
        "data": {}
    },
    "layout_render_before_cms_index_index": {
        "description": "",
        "data": {}
    },
    "layout_render_before_cms_page_view": {
        "description": "",
        "data": {}
    },
    "layout_render_before_contact_index_index": {
        "description": "",
        "data": {}
    },
    "layout_render_before_review_product_listAjax": {
        "description": "",
        "data": {}
    },
    "magento_catalog_api_data_categoryinterface_load_after": {
        "description": "",
        "data": {
            "entity": "\\Magento\\Catalog\\Model\\Category",
            "arguments": "array"
        }
    },
    "magento_catalog_api_data_categoryinterface_load_before": {
        "description": "",
        "data": {
            "identifier": "integer",
            "entity": "\\Magento\\Catalog\\Model\\Category",
            "arguments": "array"
        }
    },
    "magento_catalog_api_data_productinterface_load_after": {
        "description": "",
        "data": {
            "entity": "\\Magento\\Catalog\\Model\\Product",
            "arguments": "array"
        }
    },
    "magento_catalog_api_data_productinterface_load_before": {
        "description": "",
        "data": {
            "identifier": "string",
            "entity": "\\Magento\\Catalog\\Model\\Product",
            "arguments": "array"
        }
    },
    "magento_cms_api_data_pageinterface_load_after": {
        "description": "",
        "data": {
            "entity": "\\Magento\\Cms\\Model\\Page",
            "arguments": "array"
        }
    },
    "magento_cms_api_data_pageinterface_load_before": {
        "description": "",
        "data": {
            "identifier": "string",
            "entity": "\\Magento\\Cms\\Model\\Page",
            "arguments": "array"
        }
    },
    "model_load_after": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel",
            "field": "string",
            "value": "string"
        }
    },
    "model_save_after": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_save_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_save_commit_after": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_delete_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_delete_after": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "model_delete_commit_after": {
        "description": "",
        "data": {
            "object": "\\Magento\\Framework\\Model\\AbstractModel"
        }
    },
    "page_block_html_topmenu_gethtml_after": {
        "description": "",
        "data": {
            "menu": "\\Magento\\Framework\\Data\\Tree\\Node",
            "transportObject": "\\Magento\\Framework\\DataObject"
        }
    },
    "page_block_html_topmenu_gethtml_before": {
        "description": "",
        "data": {
            "menu": "\\Magento\\Framework\\Data\\Tree\\Node",
            "block": "\\Magento\\Theme\\Block\\Html\\Topmenu",
            "request": "\\Magento\\Framework\\App\\Request\\Http"
        }
    },
    "payment_method_is_active": {
        "description": "",
        "data": {
            "result": "\\Magento\\Framework\\DataObject",
            "method_instance": "\\Magento\\OfflinePayments\\Model\\Checkmo",
            "quote": "mixed"
        }
    },
    "prepare_catalog_product_collection_prices": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Product\\Collection",
            "store_id": "integer"
        }
    },
    "rating_rating_collection_load_before": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Review\\Model\\ResourceModel\\Rating\\Collection"
        }
    },
    "review_controller_product_init": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product"
        }
    },
    "review_controller_product_init_after": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax"
        }
    },
    "review_controller_product_init_before": {
        "description": "",
        "data": {
            "controller_action": "\\Magento\\Review\\Controller\\Product\\ListAjax"
        }
    },
    "review_review_collection_load_before": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Review\\Model\\ResourceModel\\Review\\Collection"
        }
    },
    "sales_order_address_collection_load_after": {
        "description": "",
        "data": {
            "order_address_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Address\\Collection"
        }
    },
    "sales_order_address_collection_load_before": {
        "description": "",
        "data": {
            "order_address_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Address\\Collection"
        }
    },
    "sales_order_address_collection_set_sales_order": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Address\\Collection",
            "order_address_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Address\\Collection",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_collection_load_after": {
        "description": "",
        "data": {
            "order_collection": "\\Magento\\Reports\\Model\\ResourceModel\\Order\\Collection"
        }
    },
    "sales_order_collection_load_before": {
        "description": "",
        "data": {
            "order_collection": "\\Magento\\Reports\\Model\\ResourceModel\\Order\\Collection"
        }
    },
    "sales_order_invoice_collection_load_before": {
        "description": "",
        "data": {
            "order_invoice_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Invoice\\Collection"
        }
    },
    "sales_order_invoice_collection_set_sales_order": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Invoice\\Collection",
            "order_invoice_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Invoice\\Collection",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_item_collection_load_after": {
        "description": "",
        "data": {
            "order_item_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Item\\Collection"
        }
    },
    "sales_order_item_collection_load_before": {
        "description": "",
        "data": {
            "order_item_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Item\\Collection"
        }
    },
    "sales_order_item_collection_set_sales_order": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Item\\Collection",
            "order_item_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Item\\Collection",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Sales\\Model\\Order",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_load_before": {
        "description": "",
        "data": {
            "object": "\\Magento\\Sales\\Model\\Order",
            "field": "mixed",
            "value": "string",
            "data_object": "\\Magento\\Sales\\Model\\Order",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_save_before": {
        "description": "Fires during checkout before order is saved to DB",
        "data": {
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_order_payment_collection_load_after": {
        "description": "",
        "data": {
            "order_payment_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Payment\\Collection"
        }
    },
    "sales_order_payment_collection_load_before": {
        "description": "",
        "data": {
            "order_payment_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Payment\\Collection"
        }
    },
    "sales_order_payment_collection_set_sales_order": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Payment\\Collection",
            "order_payment_collection": "\\Magento\\Sales\\Model\\ResourceModel\\Order\\Payment\\Collection",
            "order": "\\Magento\\Sales\\Model\\Order"
        }
    },
    "sales_prepare_amount_expression": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Reports\\Model\\ResourceModel\\Order\\Collection",
            "expression_object": "\\Magento\\Framework\\DataObject"
        }
    },
    "sales_quote_address_collection_load_after": {
        "description": "",
        "data": {
            "quote_address_collection": "\\Magento\\Quote\\Model\\ResourceModel\\Quote\\Address\\Collection"
        }
    },
    "sales_quote_address_collection_load_before": {
        "description": "",
        "data": {
            "quote_address_collection": "\\Magento\\Quote\\Model\\ResourceModel\\Quote\\Address\\Collection"
        }
    },
    "sales_quote_item_collection_products_after_load": {
        "description": "",
        "data": {
            "collection": "\\Magento\\Catalog\\Model\\ResourceModel\\Product\\Collection"
        }
    },
    "sales_quote_item_qty_set_after": {
        "description": "",
        "data": {
            "item": "\\Magento\\Quote\\Model\\Quote\\Item"
        }
    },
    "sales_quote_item_set_product": {
        "description": "",
        "data": {
            "product": "\\Magento\\Catalog\\Model\\Product",
            "quote_item": "\\Magento\\Quote\\Model\\Quote\\Item"
        }
    },
    "sales_quote_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Quote\\Model\\Quote",
            "quote": "\\Magento\\Quote\\Model\\Quote"
        }
    },
    "sales_quote_remove_item": {
        "description": "",
        "data": {
            "quote_item": "\\Magento\\Quote\\Model\\Quote\\Item",
        }
    },
    "sales_quote_add_item": {
        "description": "",
        "data": {
            "quote_item": "\\Magento\\Quote\\Model\\Quote\\Item",
        }
    },
    "sales_quote_product_add_after": {
        "description": "",
        "data": {
            "items": "\\Magento\\Quote\\Model\\Quote\\Item[]",
        }
    },
    "search_query_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Search\\Model\\Query",
            "search_query": "\\Magento\\Search\\Model\\Query"
        }
    },
    "search_synonyms_load_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Search\\Model\\SynonymReader",
            "search_synonyms": "\\Magento\\Search\\Model\\SynonymReader"
        }
    },
    "session_abstract_clear_messages": {
        "description": "",
        "data": {}
    },
    "shortcut_buttons_container": {
        "description": "",
        "data": {
            "container": "\\Magento\\Checkout\\Block\\QuoteShortcutButtons",
            "is_catalog_product": "boolean",
            "or_position": "string",
            "checkout_session": "\\Magento\\Checkout\\Model\\Session"
        }
    },
    "store_collection_load_after": {
        "description": "",
        "data": {
            "store_collection": "\\Magento\\Store\\Model\\ResourceModel\\Store\\Collection"
        }
    },
    "store_collection_load_before": {
        "description": "",
        "data": {
            "store_collection": "\\Magento\\Store\\Model\\ResourceModel\\Store\\Collection"
        }
    },
    "theme_save_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Theme\\Model\\Theme",
            "theme": "\\Magento\\Theme\\Model\\Theme"
        }
    },
    "theme_save_before": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Theme\\Model\\Theme",
            "theme": "\\Magento\\Theme\\Model\\Theme"
        }
    },
    "theme_save_commit_after": {
        "description": "",
        "data": {
            "data_object": "\\Magento\\Theme\\Model\\Theme",
            "theme": "\\Magento\\Theme\\Model\\Theme"
        }
    },
    "view_block_abstract_to_html_after": {
        "description": "",
        "data": {
            "block": "\\Magento\\Backend\\Block\\Widget\\Button",
            "transport": "\\Magento\\Framework\\DataObject"
        }
    },
    "view_block_abstract_to_html_before": {
        "description": "",
        "data": {
            "block": "\\Magento\\Backend\\Block\\Widget\\Button"
        }
    },
    "visitor_activity_save": {
        "description": "",
        "data": {
            "visitor": "\\Magento\\Customer\\Model\\Visitor"
        }
    }
};

export default classList;
