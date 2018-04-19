function pageInit() {
    var status = nlapiGetFieldValue('status'); // get Current status
    var acquisition_type = nlapiGetFieldText('custbody_cv_deal_type'); // get Acquisition Type
    var role = nlapiGetRole(); // get current user role
    nlapiLogExecution('debug', 'role', role);
    nlapiLogExecution('debug', 'Acquisition Type', acquisition_type);

    // Check if status is belongs from Pending Fulfillment status to Bill status
    if (status == 'Pending Fulfillment' || status == 'Partially Fulfilled' || status == 'Pending Billing/Partially Fulfilled' || status == 'Pending Billing' || status == 'Billed') {
        // Check if user_role is admin and (acquisition type is Subscription and Utility - Minimum)
        if ((role != 3) && (acquisition_type == 'Subscription' || acquisition_type == 'Utility - Minimum')) {
            nlapiLogExecution('debug', 'Executed', 'Disabled Field');
            nlapiDisableLineItemField('item', 'item', true); // lock 'ITEM' field
            nlapiDisableLineItemField('item', 'price', true); // lock 'PRICE LEVEL' field
            nlapiDisableLineItemField('item', 'custcol_list_rate', true); // lock 'LIST RATE' field
            nlapiDisableLineItemField('item', 'custcol_inline_discount', true); // lock 'DISCOUNT' field
            nlapiDisableLineItemField('item', 'quantity', true); // lock 'QTY' field
            nlapiDisableLineItemField('item', 'istaxable', true); // lock 'TAX' field
            nlapiDisableLineItemField('item', 'custcol_cv_sopp_vsoe_amount', true); // lock 'VSOE AMOUNT' field
        }
    }
}