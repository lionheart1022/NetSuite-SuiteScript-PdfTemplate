function update_modified_date() {
    var id = nlapiGetRecordId();
    var customer = nlapiLoadRecord('customer', id);

    var newSearch = nlapiLoadSearch('transaction', 2049);
    var newFilter = new nlobjSearchFilter('entity', null, 'anyof', id);
    newSearch.addFilter(newFilter);
    resultSearch = newSearch.runSearch();
    var datecreated = '';
    resultSearch.forEachResult(function(searchResult){
        datecreated = searchResult.getValue('datecreated');
        return false;
    });
    
    if(datecreated != ''){
        nlapiLogExecution('debug', 'date', datecreated);
        customer.setFieldValue('custentity_last_modified_date', nlapiDateToString(nlapiStringToDate(datecreated),'datetime'));
    }
    else {
        // datecreated = nlapiGetFieldValue('lastmodifieddate');
        // customer.setFieldValue('custentity_last_modified_date', nlapiDateToString(nlapiStringToDate(datecreated),'datetime'));
        customer.setFieldValue('custentity_last_modified_date', '');
    }
    nlapiSubmitRecord(customer);
}
