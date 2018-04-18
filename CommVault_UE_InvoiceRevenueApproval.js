/**
 * Copyright (c) 1998-2017 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */
 
 /**
 * Module Description
 * 
 * Version    Date            	Author           	Remarks
 * 1.0        01 March 2017    	iantiqueno       	Initial Version. Invoice Revenue Approval user-event after-submit script.
 * 1.1		  29 March 2017		rbautista			Added edit: On approve of invoice, auto approve revenue
 * 1.1		  30 March 2017		ccutib				Code reviewed
 *
 */
var NSUtil = (typeof NSUtil === 'undefined') ? {} : NSUtil;
 /**
 * This after-submit function will be deployed in invoice, cash sales, cash refund
 * @param {String} type
 * @returns {Void}
 */
 
 //AMH 05-16-17 Added Source Revenue Arrangement population on Invoice - native sourcing does not appear to be settingn Source Revenue Arrangement

function beforeLoad_addSourceRevenueArrangement(type, form, request){
	
	if(type == 'delete'){
		
		return;
	}
	
	if(type == 'create'){
		
		try{
			
			var strCreatedFrom = nlapiGetFieldValue('createdfrom');
			
			if(!NSUtil.isEmpty(strCreatedFrom)){
				
				var strSOSourceArrangement = nlapiLookupField('salesorder', strCreatedFrom, 'custbody_cv_source_arrangement');
				var strInvSourceArrangement = nlapiGetFieldValue('custbody_cv_source_arrangement');
				
				if(!NSUtil.isEmpty(strSOSourceArrangement) && NSUtil.isEmpty(strInvSourceArrangement)){
					
					nlapiSetFieldValue('custbody_cv_source_arrangement', strSOSourceArrangement, false);
					nlapiLogExecution('DEBUG', 'Source Arrangement Set', 'Arrangement ID: ' + strSOSourceArrangement + ' ' + 'Set on Invoice');
				}
			}
		}
		catch(error){
			nlapiLogExecution('ERROR', 'Error Setting Source Revenue Arrangement', error.message);
		}
	}
}

 function afterSubmit_invoiceRevenueApproval(type)
 {
	var stLogTitle = 'afterSubmit_invoiceRevenueApproval';
	nlapiLogExecution('DEBUG', stLogTitle, '*** START ***');
	try
	{
		nlapiLogExecution('DEBUG', stLogTitle, 'type: '+ type);
		//check if type is not equal to 'Create' and not equal to 'Edit'
		if(type != 'create' && type!='edit')
		{
			//exit the script
			return;
		}
		//get and store the value of the Invoice record 'Created From' field
		var stCreatedFrom = nlapiGetFieldValue('createdfrom');
		
		//AMH 05-08-17 Update to account for Invoice and Credit Memo Approval
		var stRecordType = nlapiGetRecordType();
		var stRecordId = nlapiGetRecordId();
		
		//AMH 06-06-17 Update to account for Stand-Alone Revenue Arrangement approval
		
		var strRevArrangeInv = false;
		
		//AMH 08-07-17 Variable to handle Invoices with Rev Arrange and Created From records
		
		var objCreatedFromRevArrangeInvoice = {};
		var boolCreateFromRevArrangeInvoice = false;
		
		if(stRecordType == 'invoice'){
			
			var objInvoiceRecord = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			
			var strNumLines = nlapiGetLineItemCount('item');
			
			for(var x = 1;x<=strNumLines;x++){
				
				//AMH 08-08-17 Updated to use OBJ line item value
				
			//	var strAttachedToRevenueElement = nlapiGetLineItemValue('item', 'attachedtorevenueelement', x);
				//var strAttachedToRevenueElementText = nlapiGetLineItemText('item', 'attachedtorevenueelement', x);
				
				var strAttachedToRevenueElementObj = objInvoiceRecord.getLineItemValue('item', 'attachedtorevenueelement', x);
				
				//nlapiLogExecution('DEBUG', 'CV DEBUG | Attached to Element', 'Line ' + x + ' ' + 'Attached to Element Settings ' + strAttachedToRevenueElement);
				//nlapiLogExecution('DEBUG', 'CV DEBUG | Attached to Element', 'Line ' + x + ' ' + 'Attached to Element Settings ' + strAttachedToRevenueElementText);
				nlapiLogExecution('DEBUG', 'CV DEBUG | Attached to Element | OBJ', 'Line ' + x + ' ' + 'Attached to Element Settings ' + strAttachedToRevenueElementObj);
				
				if(strAttachedToRevenueElementObj == 'T'){
					
					nlapiLogExecution('DEBUG', 'CV DEBUG | Attached to Element', 'Line ' + x + ' ' + 'is attached to element. Updating stRevArrangeInv to true');
					strRevArrangeInv = true;
					break;
				}
			}
			
			
		}
		
		
		nlapiLogExecution('DEBUG', 'CV DEBUG | Created From', stCreatedFrom);
		nlapiLogExecution('DEBUG', 'CV DEBUG | Record Type', stRecordType);
		nlapiLogExecution('DEBUG', 'CV DEBUG | Record ID', stRecordId);
		nlapiLogExecution('DEBUG', 'CV DEBUG | Use Arrangement', strRevArrangeInv); //AMH 06-06-17 Updated to account for Stand-Alone Invoice Revenue Arrangement Approval

		//AMH 08-07-17 Updated to remove script return for Stand-alone invoices with no Created From
		
		/**
		if(NSUtil.isEmpty(stCreatedFrom) && (strRevArrangeInv)) //AMH 06-06-17 Updated to account for Stand-Alone Invoice Revenue Arrangement Approval
		{
			nlapiLogExecution('DEBUG', stLogTitle, '>>> Exit Script <<<');
			//exit the script
			return;
		}
		**/
		
		//get and store the current context object
		var context = nlapiGetContext();
		//get the Pending Approval script parameter
		var stPendingApproval = context.getSetting('SCRIPT', 'custscript_commvault_pendingapproval');
		//AMH 05-18-17 Updated Script Parameters for custom Pending Approval Status
		var strCVPendingApproval = context.getSetting('SCRIPT', 'custscript_cv_pending_approval_status');
		//get the Approved script parameter
		var stRevApproved = context.getSetting('SCRIPT', 'custscript_commvault_rev_approved');

		var stInvApproved = context.getSetting('SCRIPT', 'custscript_commvault_inv_approved');

		//get the Saved Search script parameter
		var stSavedSearch = context.getSetting('SCRIPT', 'custscript_commvault_savedsearch');
		
		//AMH 04-26-17 Updates to include saved search script parameters
		
		//Billed Search Parameter
		var stBilledSearch = context.getSetting('SCRIPT', 'custscript_cv_billed_amount_search_2');
		
		//Recognized Search Parameter
		var stRecognizedSearch = context.getSetting('SCRIPT', 'custscript_cv_recognized_amt_srch');
		
		//Unbilled Search Parameter
		var stUnbilledSearch = context.getSetting('SCRIPT', 'custscript_cv_unbilled_amount_search');
		
		//Deferred Search Parameter
		var stDeferredSearch = context.getSetting('SCRIPT', 'custscript_cv_deferred_amount_search');
		
		//check if one of the required
		if(NSUtil.isEmpty(stPendingApproval) || NSUtil.isEmpty(stSavedSearch) || NSUtil.isEmpty(stRevApproved) || NSUtil.isEmpty(stInvApproved))
		{
			//this will throw an error
			throw nlapiCreateError('99999', 'Missing script parameter value');
		}
		//get related/associated Revenue Arrangement record
		
		//AMH 05-08-17 Update to account for Invoice & Credit Memo Approval
		//AMH 06-06-17 Update to account for Stand-Alone Invoice Processing
		
		var objRevenueArrangementInfo = {};
		
		//AMH 08-07-17 Updated to handle invoices that have related revenue arrangement as well as a related Sales Order - Script needs to update Revenue Arrangement related to invoice as well as Sales Order
		
		if(stRecordType == 'invoice' && strRevArrangeInv == false){ //AMH 06-06-17 Update to account for Stand-Alone Invoice Processing
			
			objRevenueArrangementInfo = getRevenueArrangementInfo(stSavedSearch, stCreatedFrom);
			//check if there is no related/associated Revenue Arrangement record
			if(NSUtil.isEmpty(objRevenueArrangementInfo))
			{
				//exit script
				return;
			}
		}
		
		if(stRecordType == 'invoice' && strRevArrangeInv == true){
			
			objRevenueArrangementInfo = getRevenueArrangementInfo(stSavedSearch, stRecordId);
			//check if there is no related/associated Revenue Arrangement record
			
			//AMH 08-08-17 Update to process Invoices that have both a revenue arrangement as well as a related Sales Order
			
			if(!NSUtil.isEmpty(stCreatedFrom)){
				
				nlapiLogExecution('DEBUG', 'CV DEBUG | Created From/Rev Arrange Invoice Processing', 'Created From ID: ' + stCreatedFrom);
				objCreatedFromRevArrangeInvoice = getRevenueArrangementInfo(stSavedSearch, stCreatedFrom);
				boolCreateFromRevArrangeInvoice = true;
				
			}
			if(NSUtil.isEmpty(objRevenueArrangementInfo))
			{
				//exit script
				return;
			}
			
		}
		
		if(stRecordType == 'creditmemo'){
			
			objRevenueArrangementInfo = getRevenueArrangementInfo(stSavedSearch, stRecordId);
			//check if there is no related/associated Revenue Arrangement record
			if(NSUtil.isEmpty(objRevenueArrangementInfo))
			{
				//exit script
				return;
			}
		}
		
		
		//If type = create, set revenue status to pending approval
		if(type=='create')
		{
			try{
				//get the Status (field internalid = approvalstatus) of the Revenue Arrangement record associated with the Invoice, and Sales Order records
				var stApprovalStatus = objRevenueArrangementInfo.approvalstatus;
				nlapiLogExecution('DEBUG', 'CV DEBUG | Create | Arrangement Approval Status', stApprovalStatus);
				nlapiLogExecution('DEBUG', 'CV DEBUG | Create | Pending Approval Param', stPendingApproval);
				//check if variable stApprovalStatus is not equal to Pending Approval
				if(stApprovalStatus != stPendingApproval)
				{
					//get the internalid of the Revenue Arrangement record
					var stRevenueArrangementInternalId = objRevenueArrangementInfo.revarrangement;
					nlapiLogExecution('DEBUG', 'CV DEBUG | Create | Setting Approval Status', 'Arrangement ID: ' + stRevenueArrangementInternalId);
					//update the Revenue Arrangement record set Status (approvalstatus) = TO_STATUS (i.e Pending Approval)
					//nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'approvalstatus', stPendingApproval);
					//nlapiLogExecution('AUDIT', stLogTitle, 'Successfully update Revenue Arrangement record with internalid: '+ stRevenueArrangementInternalId + ' SET Status = Pending Approval');
					
					//AMH 05-17-17 Updates to set custom status to Pending Approval
					var objRevArrangeRec = nlapiLoadRecord('revenuearrangement', stRevenueArrangementInternalId); //AMH 05-23-17 Updated from nlapiGetRecordType to 'revenuearrangement'
					objRevArrangeRec.setFieldValue('approvalstatus', stPendingApproval);
					objRevArrangeRec.setFieldValue('custbody_inv_app_status_2', strCVPendingApproval);
					var id = nlapiSubmitRecord(objRevArrangeRec);
					nlapiLogExecution('DEBUG', 'Set Initial Values on Create', 'Arrangement ID: ' + id);
				}
				//AMH 08-07-17 Updated to process Invoices that have both Created From records as well as Revenue Arrangements
				if(boolCreateFromRevArrangeInvoice){
					
					var stCFApprovalStatus = objCreatedFromRevArrangeInvoice.approvalstatus;
					nlapiLogExecution('DEBUG', 'CV DEBUG| Created From/Rev Arrange Invoice | Arrangement Approval Status', stCFApprovalStatus);
					
					if(stCFApprovalStatus != stPendingApproval){
						
						var stCFRevenueArrangementInternalID = objCreatedFromRevArrangeInvoice.revarrangement;
						var objCFRevArrangeRec = nlapiLoadRecord('revenuearrangement', stCFRevenueArrangementInternalID);
						objCFRevArrangeRec.setFieldValue('approvalstatus', stPendingApproval);
						objCFRevArrangeRec.setFieldValue('custbody_inv_app_status_2', strCVPendingApproval);
						var cfID = nlapiSubmitRecord(objCFRevArrangeRec);
						nlapiLogExecution('DEBUG', 'CV DEBUG | Updating Created From Revenue Arrangement', cfID);
					}
				}
				
			}
			catch(error){
				nlapiLogExecution('ERROR', 'Error Setting Status to Pending Approval', error.message);
			}
		}
		//If type = create and status is updated to approved, set revenue status to pending approval
		else if(type=='edit')
		{
			try{
				
				var newRec = nlapiGetNewRecord();
				//AMH 05-11-07 removed var oldRec = nlapiGetOldRecord();
				var stCurrentStatus =newRec.getFieldValue('custbody_inv_app_status_2');
				//AMH 05-11-07 removed var stOldStatus =oldRec.getFieldValue('custbody_inv_app_status_2');
				//If current status is approved and status was updated from non-approved to approved
				
				//AMH 05-11-07 -- Removed the checking of status change if(stCurrentStatus == stInvApproved && stOldStatus!=stCurrentStatus)
				if(stCurrentStatus == stInvApproved)
				{
					nlapiLogExecution('DEBUG', 'CV DEBUG | Edit | stOldStatus != stCurrentStatus', stCurrentStatus);
					//get the internalid of the Revenue Arrangement record
					var stRevenueArrangementInternalId = objRevenueArrangementInfo.revarrangement;
					nlapiLogExecution('DEBUG', 'CV DEBUG | Edit | stOldStatus != stCurrentStatus', 'Arrangement ID: ' + stRevenueArrangementInternalId);
					//get the internalid of the Created From Record
					var strCreatedFrom = nlapiGetFieldValue('createdfrom');
					nlapiLogExecution('DEBUG', 'CV DEBUG |Edit | Get Arrangement Internal ID', stRevenueArrangementInternalId);
					var objRevArrangeRec = nlapiLoadRecord('revenuearrangement', stRevenueArrangementInternalId);
					//update the Revenue Arrangement record set Status (approvalstatus) = TO_STATUS (i.e Approved)
					//nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'approvalstatus', stRevApproved);
					nlapiLogExecution('DEBUG', 'CV DEBUG | Edit | Setting Approval Status', 'Setting Approval Status to ' + stRevApproved);
					objRevArrangeRec.setFieldValue('approvalstatus', stRevApproved);
					
					//AMH 05-16-17 Updated to set Reporting Approval Status to Approved
					objRevArrangeRec.setFieldValue('custbody_inv_app_status_2', stInvApproved);
					
					//AMH 05-08-17 Update for Credit Memo Approval Status
					//AMH 06-06-17 Update for Stand-Alone Invoice Processing
					//AMY 08-08-17 Updated to remove strRevArrangeInv condition and add !NSUtil.isEmpty(strCreatedFrom)
					
					if(stRecordType == 'invoice' && !NSUtil.isEmpty(strCreatedFrom)){
						
						//AMH 04-26-17 Updates to update Billing, Recognized, Unbilled, and Deferred Amounts when Invoice Approval occurs
						
						//Get Billed Amount and Set on Revenue Arrangement
						
						var arrBilledAmountFilters = [new nlobjSearchFilter('createdfrom', null, 'is', stCreatedFrom),
						                              new nlobjSearchFilter('mainline', null, 'is', true)];
						var arrBilledAmountResults = NSUtil.search('transaction', stBilledSearch, arrBilledAmountFilters)
						
						if(arrBilledAmountFilters.length > 0){
							
							var strBilledAmount = arrBilledAmountResults[0].getValue('fxamount', null, 'SUM');
							//nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'custbody_cv_total_invoice_amount', strBilledAmount);
							objRevArrangeRec.setFieldValue('custbody_cv_total_invoice_amount', strBilledAmount);
						}
						//Get Recognized Amount and set on Revenue Arrangement
						
						var arrRecognizedAmountFilters = [new nlobjSearchFilter('internalid', 'sourcetransaction', 'is', strCreatedFrom)];
						var arrRecognizedAmountResults = NSUtil.search('revenueelement', stRecognizedSearch, arrRecognizedAmountFilters);
						
						if(arrRecognizedAmountResults.length > 0){
							
							var strRecognized = arrRecognizedAmountResults[0].getValue('totalrecognized', 'revenueplan', 'sum');
							//nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'custbody_cv_recognized_amount', strRecognized);
							objRevArrangeRec.setFieldValue('custbody_cv_recognized_amount', strRecognized);
						}
						//Get Unbilled Amount and set on Revenue Arrangement
						
						var arrUnbilledAmountFilters = [new nlobjSearchFilter('internalid', 'sourcetransaction', 'is', strCreatedFrom)];
						var arrUnbilledAmountResults = NSUtil.search('revenueelement', stUnbilledSearch, arrUnbilledAmountFilters);
						
						if(arrUnbilledAmountResults.length > 0){
							
							var strUnbilledAmount = arrUnbilledAmountResults[0].getValue('formulacurrency', null, 'SUM');
							// nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'custbody_cv_total_unbilled', strUnbilledAmount);
							objRevArrangeRec.setFieldValue('custbody_cv_total_unbilled', strUnbilledAmount);
						}
						
						//Get Deferred Amount and set on Revenue Arrangement
						var arrDeferredAmountFilters = [new nlobjSearchFilter('internalid', 'sourcetransaction', 'is', strCreatedFrom)];
						var arrDeferredAmountResults = NSUtil.search('revenueelement', stDeferredSearch,arrDeferredAmountFilters);
						
						if(arrDeferredAmountResults.length > 0){
							
							var strDefferedAmount = arrDeferredAmountResults[0].getValue('formulacurrency', null, 'SUM');
							// nlapiSubmitField('revenuearrangement', stRevenueArrangementInternalId, 'custbody_cv_total_deferred', strDefferedAmount);
							objRevArrangeRec.setFieldValue('custbody_cv_total_deferred', strDefferedAmount);
						}
					}
					
					if(stRecordType == 'creditmemo'){
						
						var stTotalAmount = newRec.getFieldValues('total');
						objRevArrangeRec.setFieldValue('custbody_cv_total_invoice_amount', stTotalAmount);
						var stDeferredAmount = objRevArrangeRec.getFieldValues('custbody_cv_total_deferred');
						
						if(NSUtil.isEmpty(stDeferredAmount)){
							objRevArrangeRec.setFieldValue('custbody_cv_total_deferred', stTotalAmount);
						}
						
					}
					nlapiLogExecution('AUDIT', stLogTitle, 'Successfully update Revenue Arrangement record with internalid: '+ stRevenueArrangementInternalId + ' SET Status = Approved');
					nlapiSubmitRecord(objRevArrangeRec);
					
					//AMH 08-08-17 Updated to handle Invoices with a related Created From and Revenue Arrangement
					if(boolCreateFromRevArrangeInvoice){
						
						nlapiLogExecution('DEBUG', 'CV DEBUG | Update Created From Revenue Arrangement', 'Begin Processing Created From/Arrangement Invoice');
						var stCFArrangementID = objCreatedFromRevArrangeInvoice.revarrangement;
						nlapiLogExecution('DEBUG', 'CV DEBUG | Update Created From Revenue Arrangement', 'Arrangement ID: ' + stCFArrangementID);
						var objCFArrangementID = nlapiLoadRecord('revenuearrangement', stCFArrangementID);
						objCFArrangementID.setFieldValue('approvalstatus', stRevApproved);
						objCFArrangementID.setFieldValue('custbody_inv_app_status_2', stInvApproved);
						
						var cfREVID = nlapiSubmitRecord(objCFArrangementID);
						nlapiLogExecution('DEBUG', 'CV DEBUG | Submitting Arrangement Changes', cfREVID);
						
						
					}
				
				}
				

			}
			catch(error){
				nlapiLogExecution('ERROR', 'Error Setting Status to Approved', error.message);
				}
		}
	}
	catch(error)
	{
		if (error.getDetails() != undefined)
        {
			nlapiLogExecution('ERROR', 'Process Error', '[' + nlapiGetContext().getScriptId() + '] ' + error.getCode() + ': ' + error.getDetails() + ' on ' + stLogTitle);			
			throw error;
        }
        else
        {        	
        	nlapiLogExecution('ERROR', 'Unexpected Error', error.toString() + ' on ' + stLogTitle);
        	throw error;
        }
	}
	finally
	{
		nlapiLogExecution('DEBUG', stLogTitle, '*** END ***');
	}
 }
 
 function getRevenueArrangementInfo(stSavedSearch, stSalesOrder)
 {
	var stLogTitle = 'getRevenueArrangementInfo';
	var objRevenueArrangementInfo = null;
	nlapiLogExecution('DEBUG', stLogTitle, '*** START ***');
	try
	{
		//this will create a saved search filter, this will be added to the existing filter conditions of the saved search
		var arrFilters = [new nlobjSearchFilter('internalid', 'sourcetransaction', 'anyof', stSalesOrder)];
		//run/execute an revenue element saved search
		var objSearchResult = NSUtil.search('revenueelement', stSavedSearch, arrFilters);
		//check if saved search result is not empty
		if(!NSUtil.isEmpty(objSearchResult))
		{
			objRevenueArrangementInfo = new Object();
			//get the internalid of the Revenue Arrangement record
			var stRevenueArrangementInternalId = objSearchResult[0].getValue('internalid', 'revenueArrangement', 'GROUP');
			//get the status of the Revenue Arrangement
			var stApprovalStatus = objSearchResult[0].getText('statusref', 'revenueArrangement', 'GROUP');
			//create function return object
			objRevenueArrangementInfo.revarrangement = stRevenueArrangementInternalId;
			objRevenueArrangementInfo.approvalstatus = stApprovalStatus;
		}
	}
	catch(error)
	{
		if (error.getDetails() != undefined)
        {
			nlapiLogExecution('ERROR', 'Process Error', '[' + nlapiGetContext().getScriptId() + '] ' + error.getCode() + ': ' + error.getDetails() + ' on ' + stLogTitle);			
			throw error;
        }
        else
        {        	
        	nlapiLogExecution('ERROR', 'Unexpected Error', error.toString() + ' on ' + stLogTitle);
        	throw error;
        }
	}
	finally
	{
		nlapiLogExecution('DEBUG', stLogTitle, '*** END ***');
		
	}
	return objRevenueArrangementInfo;
 }
 
 /*
 * -------------------------------Utility Functions-------------------------------
 *
 */

/**
 * 
 * Version 1:
 * @author memeremilla
 * Details: Initial version
 * 
 * Version 2: 
 * @author bfeliciano
 * Details: Revised shorthand version.
 *
 * @param {String} stValue - string or object to evaluate
 * @returns {Boolean} - true if empty/null/undefined, false if not
 * 
 */
NSUtil.isEmpty = function(stValue)
{
	return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v)
	{
		for ( var k in v)
			return false;
		return true;
	})(stValue)));
};

/**
 * Get all of the results from the search even if the results are more than 1000.
 * @param {String} stRecordType - the record type where the search will be executed.
 * @param {String} stSearchId - the search id of the saved search that will be used.
 * @param {nlobjSearchFilter[]} arrSearchFilter - array of nlobjSearchFilter objects. The search filters to be used or will be added to the saved search if search id was passed.
 * @param {nlobjSearchColumn[]} arrSearchColumn - array of nlobjSearchColumn objects. The columns to be returned or will be added to the saved search if search id was passed.
 * @returns {nlobjSearchResult[]} - an array of nlobjSearchResult objects
 * @author memeremilla - initial version
 * @author gmanarang - used concat when combining the search result
 */
NSUtil.search = function(stRecordType, stSearchId, arrSearchFilter, arrSearchColumn)
{
	if (stRecordType == null && stSearchId == null)
	{
		throw nlapiCreateError('SSS_MISSING_REQD_ARGUMENT', 'search: Missing a required argument. Either stRecordType or stSearchId should be provided.');
	}

	var arrReturnSearchResults = new Array();
	var objSavedSearch;

	if (stSearchId != null)
	{
		objSavedSearch = nlapiLoadSearch((stRecordType) ? stRecordType : null, stSearchId);

		// add search filter if one is passed
		if (arrSearchFilter != null)
		{
			objSavedSearch.addFilters(arrSearchFilter);
		}

		// add search column if one is passed
		if (arrSearchColumn != null)
		{
			objSavedSearch.addColumns(arrSearchColumn);
		}
	}
	else
	{
		objSavedSearch = nlapiCreateSearch((stRecordType) ? stRecordType : null, arrSearchFilter, arrSearchColumn);
	}

	var objResultset = objSavedSearch.runSearch();
	var intSearchIndex = 0;
	var arrResultSlice = null;
	do
	{
		if ((nlapiGetContext().getExecutionContext() === 'scheduled'))
		{
			try
			{
				this.rescheduleScript(1000);
			}
			catch (e)
			{
			}
		}

		arrResultSlice = objResultset.getResults(intSearchIndex, intSearchIndex + 1000);
		if (arrResultSlice == null)
		{
			break;
		}

		arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
		intSearchIndex = arrReturnSearchResults.length;
	}

	while (arrResultSlice.length >= 1000);

	return arrReturnSearchResults;
};