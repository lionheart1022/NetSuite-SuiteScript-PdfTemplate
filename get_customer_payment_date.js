function update_modified_date_by_customer_payment() {
    var id = nlapiGetRecordId();
    var customer_payment = nlapiLoadRecord('customerpayment', id);

    var createddate = '';
    createddate = customer_payment.getFieldValue('createddate');
    
    var customer_id = customer_payment.getFieldValue('customer');

    var customer = nlapiLoadRecord('customer', customer_id);
    
    if(createddate != ''){
        nlapiLogExecution('debug', 'date', createddate);
        customer.setFieldValue('custentity_last_modified_date', nlapiDateToString(nlapiStringToDate(createddate),'datetime'));
    }
    else {
        // datecreated = nlapiGetFieldValue('lastmodifieddate');
        // customer.setFieldValue('custentity_last_modified_date', nlapiDateToString(nlapiStringToDate(datecreated),'datetime'));
        customer.setFieldValue('custentity_last_modified_date', '');
    }
    nlapiSubmitRecord(customer);
}

