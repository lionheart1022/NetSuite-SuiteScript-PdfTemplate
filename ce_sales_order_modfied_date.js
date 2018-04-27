function pageInit() {
    var status = nlapiGetFieldValue('status');
    nlapiLogExecution('debug', 'status', status);
    if (status == 'Billed') {
        modified_date = nlapiDisableField('custbody_cv_invoiced_modified_date', true);
    }
}