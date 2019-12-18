// edit cost value for purchase order line item when click "make a copy" under action button.

function edi_PageInit(type) {
    action_type = type;
    if (type == 'copy') {
        var count = nlapiGetLineItemCount('item');
        if (count == 1) {
            nlapiSelectLineItem('item', 1);
            nlapiSetCurrentLineItemValue('item','rate', '');
            nlapiSetCurrentLineItemValue('item','amount', '');
            nlapiCommitLineItem('item');
        } else {
            for(i = 1; i <= count; i++){
                nlapiSelectLineItem('item', i);
                nlapiSetCurrentLineItemValue('item','rate', '0');
                nlapiSetCurrentLineItemValue('item','amount', '0');
                nlapiCommitLineItem('item');
            }
        }
    }
}

function save_validation() {
    var count = nlapiGetLineItemCount('item');
    for(i = 1; i <= count; i++){
        nlapiSelectLineItem('item', i)
        if ((nlapiGetCurrentLineItemValue('item', 'rate') == '0.00') || nlapiGetCurrentLineItemValue('item', 'amount') == '0.00') {
            alert('Please enter a value for amount.');
            return false;
        }
    }
    return true;
}
