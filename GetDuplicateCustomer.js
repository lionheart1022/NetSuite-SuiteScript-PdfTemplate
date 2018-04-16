function getDuplicateCustomer(request, response) {
    try {
        var folderId = '5706596'; // Internal ID for download folder
        var company_names = {}; // Dictionary value to check duplicate record        
        var search_record = nlapiLoadSearch(null, 'customsearch3225'); // Customer Saved Search
        var columns = search_record.getColumns(); // Get Result Columns for saved search
        var recSearchResult = search_record.runSearch(); // Execute Saved Search
        var result_index = 0; // Search Result Iteration index
        var result_step = 1000; // Search Result Iteration count for page
        var recResultSet; // Search Result Set
        var valueList = [['Customer Name', 'Internal ID', 'SFDC ID', 'Channel Tier', 'Inactive', 'Url']]; // CSV Value list
        var other_c_names =  [['Customer Name', 'Internal ID', 'SFDC ID', 'Channel Tier', 'Inactive', 'Url']];

        do {
            recResultSet = recSearchResult.getResults(result_index, result_index + result_step); // Get Search 1000 Results from {index}
            result_index = result_index + result_step; // Move Iteration page

            if (recResultSet.length > 0) {

                // Check the Search Result for each record and calculate duplicate count.
                // Update dictionary value with duplicate count and record values if the Channel tier value is "Reseller";
                for (var i = 0; i < recResultSet.length; i++) {
                    var company_name = recResultSet[i].getValue('companyname').toLowerCase(); // Get Customer Name field value
                    var channel_tier = recResultSet[i].getText(columns[3]); // Get Channel Tier field value
                    var subsidiary = recResultSet[i].getValue(columns[5]); // Get Subsidiary field value
                    if (company_name == '') {
                        continue;
                    }
                    if (!company_names.hasOwnProperty(subsidiary)) {
                        company_names[subsidiary] = {};
                    }
		    
                    if (company_names[subsidiary].hasOwnProperty(company_name)) {
                        company_names[subsidiary][company_name]['dup_count'] = parseInt(company_names[subsidiary][company_name]['dup_count']) + 1; // Increase duplicate count by customer name
                    } else {
                        company_names[subsidiary][company_name] = {}; // Create dictionary key with customer name
                        company_names[subsidiary][company_name]['dup_count'] = 1; // Initialize duplicate count by customer name
                        company_names[subsidiary][company_name]['values'] = [];
                        company_names[subsidiary][company_name]['has_reseller'] = 0;
                        company_names[subsidiary][company_name]['has_end_user'] = 0;
                    }

                    var dict = new Array(5);
                    dict[0] = recResultSet[i].getValue(columns[0]).replace(',', ' '); // Get "Customer Name" field value
                    dict[1] = recResultSet[i].getValue(columns[1]); // Get "Internal id" field value
                    dict[2] = recResultSet[i].getValue(columns[2]); // Get "SFDC id" field value
                    dict[3] = channel_tier;
                    dict[4] = recResultSet[i].getValue(columns[4]); // Get "Inactive" field value
                    dict[5] = 'https://system.na1.netsuite.com/app/common/entity/custjob.nl?id=' + dict[1];
                    company_names[subsidiary][company_name]['values'].push(dict);
                    if (channel_tier == 'Reseller') {
                        company_names[subsidiary][company_name]['has_reseller'] = 1;
                    } else if ((channel_tier == 'End User') || (channel_tier == 'Distributor')) {
                        company_names[subsidiary][company_name]['has_end_user'] = 1;
                    }
                }
            }
        } while (recResultSet.length > 0);
        
	    // Update CSV value list by duplicate count and channel tier.
        Object.keys(company_names).forEach(function(subsidiary) {
            Object.keys(company_names[subsidiary]).forEach(function(key) {
                var record = new Array(5);

                // If the customer is duplicate one and channel tier is 'Reseller'
                if (company_names[subsidiary][key]['dup_count'] > 1 && company_names[subsidiary][key]['has_reseller'] && company_names[subsidiary][key]['has_end_user']) {
                    for (var i = 0; i < company_names[subsidiary][key]['values'].length; i++) {
                        var value = company_names[subsidiary][key]['values'][i];
                        if (value[3] == "Reseller") {
                            valueList.push(value);
                        } else {
                            other_c_names.push(value);
                        }
                    }
                }
            });
        });
	    // Create CSV content from CSV value list.
        var csvContent = '';
        valueList.forEach(function(dict, index) {
            dataString = dict.join(',');
            csvContent += index < valueList.length ? dataString + "\n" : dataString;
        });

	    // Set 'Duplicate Customer.csv' file to FileCabinet folder - 'Duplicate Customer' : https://system.na1.netsuite.com/app/common/media/mediaitemfolders.nl?folder=5706596&whence=&cmid=1517752902081_4780
        var csvFile = nlapiCreateFile('Duplicate Customer.csv', 'CSV', csvContent);
        csvFile.setFolder(folderId);

	    // Create File
        var file_id = nlapiSubmitFile(csvFile);

        // Get Download link
        var file_url = 'https://system.na1.netsuite.com/core/media/media.nl?id=' + file_id + '&c=3673207&h=83916c2d1c76f98c9856&_xt=.csv';
    
        // Create CSV content from CSV othere_c_names - Other type channel tier customers.
        var otherCsvContent = '';
        other_c_names.forEach(function(dict, index) {
            dataString = dict.join(',');
            otherCsvContent += index < other_c_names.length ? dataString + "\n" : dataString;
        });        

        // Set 'Duplicate Customer.csv' file to FileCabinet folder - 'Duplicate Other Customer' : https://system.na1.netsuite.com/app/common/media/mediaitemfolders.nl?folder=5706596&whence=&cmid=1517752902081_4780
        var otherCsvFile = nlapiCreateFile('Duplicate Other Customer.csv', 'CSV', otherCsvContent);
        otherCsvFile.setFolder(folderId);

	    // Create File
        var other_file_id = nlapiSubmitFile(otherCsvFile);

        // Get Download link
        var other_file_id = nlapiSubmitFile(otherCsvFile);
        var other_file_url = 'https://system.na1.netsuite.com/core/media/media.nl?id=' + other_file_id + '&c=3673207&h=20dc1b285e6f1517d886&_xt=.csv';

	    // Print File id and download link to page.
        var res = 'Created Reseller File Id is ' + file_id + '.  <a href="' + file_url + '">Download</a><br/>Created Other Type of Customer File Id is ' + other_file_id + '.  <a href="' + other_file_url + '">Download</a>';
        response.write(res);
    } catch (e) {
        nlapiLogExecution('debug', 'error', e.getDetails());
    }
}
