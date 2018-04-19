function ProfileToCSV(request, response) {
    try {
        nlapiLogExecution('Debug', 'Start', 'Scheduled Script Started');

        var employees = {};    
        var project_search_record=nlapiLoadSearch(null,'customsearch_egencia_project');
        var projectResultSet = project_search_record.runSearch();
        projectResultSet.forEachResult(function(searchResult) {        
            var employeeID = searchResult.getValue('internalid','CUSTENTITY_PROJECTMANAGER');
            employees[employeeID] = true;
            return true;
        });

        var search_id= 'customsearch_egencia_profile';
        var load_search_record=nlapiLoadSearch(null,search_id);
        var columns = load_search_record.getColumns();
        var folderId = 61499;//53173;

        var resultSet = load_search_record.runSearch();
        var valueList = [['Title (1)', 'Last Name (2)', 'First Name (3)', 'Date of birth DD/MM/YYYY (4)', 'City of birth (5)', 'Job title (6)', 'Employee\'s ID (7)', 'Country of residence (8)', 'Email (9)', 'Password (10)', 'Status Active or Inactive (11)', 'Work phone (12)', 'Fax (13)', 'Home phone (14)', 'Mobile phone (15)', 'Passport Number (16)', 'Passport issue date DD/MM/YYYY (17)', 'Passport expiration date DD/MM/YYYY (18)', 'Passport issue place (19)', 'Passport Nationality (20)', 'Identity card number (21)', 'Identity card issue date DD/MM/YYYY (22)', 'Identity card expiration date DD/MM/YY (23)', 'Identity card issue place (24)', 'Identity card Nationality (25)', 'Driving licence number (26)', 'Driving licence issue date DD/MM/YYYY (27)', 'Driving licence expiration date DD/MM/YYYY (28)', 'Driving licence issue place (29)', 'Driving licence Nationality (30)', 'Email reception mode (31)', 'Traveller Group (32)', 'Approvers (33)', 'Arrangers (34)', 'Self-Booker Yes or No (35)', 'Is Arranger Yes or No (36)', 'Is Approver Yes or No (37)', 'Main Cost Centre (38)', 'Secondary Cost Centre (39)', 'CC4 (O1)', 'CC5 (O2)', 'Meal Preference (40)', 'Seat Preference (41)', 'Departure City (42)', 'Email language (43)', 'login (44)', 'Viapay_preference (45)', 'Is_flexible_arranger (46)', 'Level2_approvers (47)', 'Level3_approvers (48)', 'Level4_approvers (49)', 'Occasional Traveier Arranger (52)', 'Report Analyst (53)', 'Accountant (54)', 'Security Manager (55)', 'Manage users (56)', 'Manage Travel policies (57)', 'Manage company security (58)', 'Customize website (59)', 'Departure city Rail (60)', 'Seat Rail (61)', 'Seat direction Rail (62)', 'Room Rail (63)', 'First class Solo Rail (64)', 'Delegate Approvers (65)', 'Currency Display (66)', 'Chinese name (O3)', 'Local Last name (O4)']];
        
        var csvContent = '';// = "data:text/csv;charset=utf-8\n";
        var csvNLContent = '';
        var csvUKContent = '';

        resultSet.forEachResult(function(searchResult) {
            var item = new Array(69);
            var employeeID = searchResult.getId();
            var legalEntity = searchResult.getText(columns[8]);

            item[0] = searchResult.getValue(columns[0]); // Mr./Mrs... -> Title (1)
            item[1] = searchResult.getValue(columns[1]); // Last Name -> Last Name (2)
            item[2] = searchResult.getValue(columns[2]); // First Name -> First Name (3)
            item[6] = searchResult.getValue(columns[3]); // InternalID -> Employee's ID (7)
            item[8] = searchResult.getValue(columns[4]); // Email -> Email (9)
            item[10] = searchResult.getValue(columns[5]); // Status -> Status Active or Inactive (11)
            item[31] = searchResult.getValue(columns[6]); // Formula -> Traveller Group (32)
            item[34] = searchResult.getValue(columns[7]); // Formula -> Self-Booker Yes or No (35)
            item[37] = searchResult.getText(columns[8]); // Subsidiary -> Main Cost Centre (38)
            item[38] = 'Select project below'; // searchResult.getValue(columns[9]); // Formula -> Secondary Cost Centre (39)
            // item[0] = searchResult.getValue(columns[10]); // Formula ->
            item[39] = searchResult.getValue(columns[9]); // Formula -> CC4 (O1)
            item[45] = searchResult.getValue(columns[4]); // Email -> login (44)

            if (employees.hasOwnProperty(employeeID)) {
                item[47] = 'Yes';
                item[36] = 'Yes';
                item[64] = getDelegateApprover(item[37]);
            }
            valueList.push(item);
            
            if ((item[47] == 'Yes') && (item[37] != 'Backbase USA')) {
                var aliasItem = JSON.parse(JSON.stringify(item));
                
                if (getAliasCostCentre(aliasItem[37]) == 'Backbase UK') {
                    aliasItem[45] = aliasItem[45].split('@')[0] + '.uk@' + aliasItem[45].split('@')[1];
                } else if (getAliasCostCentre(aliasItem[37]) == 'Backbase Europe') {
                    aliasItem[45] = aliasItem[45].split('@')[0] + '.nl@' + aliasItem[45].split('@')[1];
                }
                if (aliasItem[64] == 'travelUK@backbase.com') {
                    aliasItem[64] = 'travelEU@backbase.com';
                } else if (aliasItem[64] == 'travelEU@backbase.com') {
                    aliasItem[64] = 'travelUK@backbase.com';
                } else {
                    aliasItem[64] = '';
                }
                aliasItem[37] = getAliasCostCentre(aliasItem[37]);
                valueList.push(aliasItem);
            }
            
            return true;
        });
        
        valueList.forEach(function(dict, index) {
            dataString = dict.join(";");
            csvContent += index < valueList.length ? dataString + "\n" : dataString;
            if (index == 0) {
                csvUKContent += index < valueList.length ? dataString + "\n" : dataString;
                csvNLContent += index < valueList.length ? dataString + "\n" : dataString;
            }
            if (dict[37] == 'Backbase UK') {
                csvUKContent += index < valueList.length ? dataString + "\n" : dataString;
            } else if ((dict[37] == 'Backbase BV') || (dict[37] == 'Backbase Europe') || (dict[37] == 'Backbase R&D')) {
                csvNLContent += index < valueList.length ? dataString + "\n" : dataString;
            }
        });

        var csvFile = nlapiCreateFile('Profile.csv', 'CSV', csvContent);
        var csvNLFile = nlapiCreateFile('ProfileNL.csv', 'CSV', csvNLContent);
        var csvUKFile = nlapiCreateFile('ProfileUK.csv', 'CSV', csvUKContent);
        csvFile.setFolder(folderId);
        csvNLFile.setFolder(folderId);
        csvUKFile.setFolder(folderId);
        var id = nlapiSubmitFile(csvFile);
        var idNL = nlapiSubmitFile(csvNLFile);
        var idUK = nlapiSubmitFile(csvUKFile);

        nlapiLogExecution('DEBUG', 'ID', 'Created File ID is ' + id + ',' + idNL + ',' + idUK + '.');
        response.write(idUK + ',' + idNL);
        
    } catch (error) {
        var stErrorString = '';
        
        if (error.getDetails != undefined)
        {
            stErrorString = error.getCode() + ': ' + error.getDetails();
            nlapiLogExecution('AUDIT', 'Process Error', stErrorString);
        }
        else
        {
            stErrorString = error.toString();
            nlapiLogExecution('AUDIT', 'Unexpected Error', stErrorString); 
        }
    }
}

function SendRequestToPHP(type, location, data) {
    var url = 'http://54.174.171.234/UploadCSV.php';
    
    var param = {"type":type, "location":location, "data":data};
    var paramJson = JSON.stringify(param, replacer);
    var response = nlapiRequestURL(url, paramJson, null, "POST");

    return response.getBody();
}

function getDelegateApprover(legalEntity) {
    if ((legalEntity == 'Backbase Europe') || (legalEntity == 'Backbase R&D') || (legalEntity == 'Backbase BV')) {
        return 'travelEU@backbase.com';
    } else if (legalEntity == 'Backbase UK') {
        return 'travelUK@backbase.com';
    } else if (legalEntity == 'Backbase USA') {
        return 'travelUSA@backbase.com';
    }

    return '';
}

function getAliasCostCentre(mainCostCentre) {
    if ((mainCostCentre == 'Backbase BV') || (mainCostCentre == 'Backbase Europe') || (mainCostCentre == 'Backbase R&D')) {
        return 'Backbase UK';
    } else if (mainCostCentre == 'Backbase UK') {
        return 'Backbase Europe';
    }
    return '';
}

function replacer(key, value){
    if (typeof value == "number" && !isFinite(value)){
        return String(value);
    }
    return value;
}