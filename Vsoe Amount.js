/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){

	// Applying this functionality for editing status or creating status.
	if((type == 'edit') || (type == 'create')){
	
		var numLines = nlapiGetLineItemCount('item');
		var SOPPAmount = 0;
		var lineAmount = 0;
		var tranAmount = nlapiGetFieldValue('subtotal');
		var boolContainsSOPPValues = false;
		var noneCount = 0; // Variable for calculating how many vsoe amount value is blank
		var allNoneValueCheck = false; // Boolean variable for checking all vsoe amount value is blank or not.

		for(var x=1; x<=numLines; x++){

			lineAmount = parseFloat(nlapiGetLineItemValue('item', 'custcol_cv_sopp_vsoe_amount', x));
			nlapiLogExecution('DEBUG', 'amounts', 'lineNumber: ' + x + ' ' + 'lineAmount: ' + lineAmount);
			
			// Check if vsoe amount value is blank
			if(isNaN(lineAmount)){
				lineAmount = 0; // set None value as 0 because None value can't sum.
				noneCount += 1; // if vsoe amount is None, increase the noneCount variable.
			}
			boolContainsSOPPValues = true;

			SOPPAmount += lineAmount;
			nlapiLogExecution('DEBUG', 'SOPP Amount', 'SOPP Amount :' + SOPPAmount);

		}

		// check if every vsoe amount is None value.
		if (noneCount == numLines){
			allNoneValueCheck = true; // In this case, all vsoe amount value is blank.
		}

		if(boolContainsSOPPValues){

			nlapiLogExecution('DEBUG', 'Validate Amounts', 'Transaction Total :' + tranAmount + ' ' + 'SOPP Amount ' + SOPPAmount);

			// check if all vsoe amount value is blank or not, compare total amount and total vsoe amount
			if((!allNoneValueCheck) && (SOPPAmount != tranAmount)){
				//AMH 05-17-17 Updating to allow for a tolerance

				var strToleranceAmount = Math.abs(SOPPAmount - tranAmount);

				nlapiLogExecution('DEBUG', 'Difference', strToleranceAmount);

				if(strToleranceAmount <= .01){

					nlapiLogExecution('DEBUG', 'Difference within tolerance amount', 'EXIT SCRIPT');
					return;

				}
				if(strToleranceAmount > .01){

					nlapiLogExecution('DEBUG', 'Throwing error', 'SOPP != Tran Amount');
					throw nlapiCreateError('99999', 'VSOE Amount must equal Transaction Amount. Please Modify and re-enter.');
					return false;
				}	
			}	
		}
	}
}