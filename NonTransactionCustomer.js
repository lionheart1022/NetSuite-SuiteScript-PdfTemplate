function getCustomerByTypeAndDate(request, response) {
    try {
        var folderId = '5048796'; // Internal ID for download folder 
        var records = {}; // Dictionary value to check transaction type and date        
        var idDict = {}; // Internal ID Array

        var rest_search_record = nlapiLoadSearch(null, 'customsearchtransactions_after_date'); // Customer Saved Search
        var cols = rest_search_record.getColumns();
        var restSearchResult = rest_search_record.runSearch(); // Execute Rest Saved Search*/
        var result_index = 0; // Search Result Iteration index
        var result_step = 1000; // Search Result Iteration count for page
        var restResultSet; // Rest Search Result Set

        do {
            restResultSet = restSearchResult.getResults(result_index, result_index + result_step); // Get Search 1000 Results from {index}
            result_index = result_index + result_step; // Move Iteration page

            if (restResultSet.length > 0) {
                for (var i = 0; i < restResultSet.length; i++) {
                    var internal_id = restResultSet[i].getValue(cols[0]);
                    var end_user_id = restResultSet[i].getValue(cols[1]);
                    var reseller_id = restResultSet[i].getValue(cols[2]);
                    var distributor_id = restResultSet[i].getValue(cols[3]);
                    if (!idDict.hasOwnProperty(internal_id)) {
                        idDict[internal_id] = 1;
                    }
                    if (!idDict.hasOwnProperty(end_user_id)) {
                        idDict[end_user_id] = 1;
                    }
                    if (!idDict.hasOwnProperty(reseller_id)) {
                        idDict[reseller_id] = 1;
                    }
                    if (!idDict.hasOwnProperty(distributor_id)) {
                        idDict[distributor_id] = 1;
                    }
                }
            }
        } while (restResultSet.length > 0);

        var all_search_record=nlapiLoadSearch(null, 'customsearch3083'); // All Customer Saved Search
        // var filters = [];
        // filters.push(new nlobjSearchFilter('internalid', null, 'noneof', idDict));
        // all_search_record.addFilters(filters);
        var MainSearchResult = all_search_record.runSearch();
        var columns = all_search_record.getColumns(); // Get Result Columns for saved search
        
        var MainResultSet;
        var valueList = [['Customer Name', 'Internal ID', 'SFDC ID', 'Inactive', 'Url']]; // CSV Value list
        result_index = 0;
        
        do {
            MainResultSet = MainSearchResult.getResults(result_index, result_index + result_step); // Get Search 1000 Results from {index}
            result_index = result_index + result_step; // Move Iteration page

            if (MainResultSet.length > 0) {
                for (var i = 0; i < MainResultSet.length; i++) {
                    var id = MainResultSet[i].getValue(columns[1]);
                    if (!idDict.hasOwnProperty(id)) {
                        var value = new Array(6);
                        value[0] = MainResultSet[i].getValue(columns[0]).replace(/,/g , ' '); // Get "Customer Name" field value
                        value[1] = id; // Get "Internal id" field value
                        value[2] = MainResultSet[i].getValue(columns[2]); // Get "SFDC id" field value
                        value[3] = MainResultSet[i].getValue(columns[3]); // Get "Inactive" field value
                        value[4] = 'https://system.sandbox.netsuite.com/app/common/entity/custjob.nl?id=' + value[1];// URL
                        valueList.push(value);
                    }                    
                }
            }
        } while (MainResultSet.length > 0);

	    // Create CSV content from CSV value list.
        var csvContent = '';
        // Object.keys(iDict).forEach(function(key) {
        //     csvContent += iDict[key] + "\n";
        // });
        valueList.forEach(function(dict, index) {
            dataString = dict.join(',');
            csvContent += index < valueList.length ? dataString + "\n" : dataString;
        });

	    // Set 'Transaction Filter Customer.csv' file to FileCabinet folder - 'Customer Output' : https://system.sandbox.netsuite.com/app/common/media/mediaitemfolders.nl?folder=5048796&whence=&cmid=1518119495071_4125
        var csvFile = nlapiCreateFile('Transaction Filter Customer.csv', 'CSV', csvContent);
        csvFile.setFolder(folderId);

	    // Create File
        var file_id = nlapiSubmitFile(csvFile);

        // Get Download link
        var file_url = 'https://system.sandbox.netsuite.com/core/media/media.nl?id=' + file_id + '&c=3673207_SB2&h=7139d7c4928714a19162&_xt=.csv';

	    // Print File id and download link to page.
        var res = 'Created TransFilter File Id is ' + file_id + '.  <a href="' + file_url + '">Download</a>';
        response.write(res);
    } catch (e) {
        nlapiLogExecution('debug', 'error', e.getDetails());
    }
}
