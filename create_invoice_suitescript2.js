/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task'],

function(record, runtime, search, task) {
	
'use strict';

	var SUBSIDIARY      = 'subsidiary';
	var CLASS	        = 'class';
	var NAME            = 'name';
	var ENTITY          = 'entity';
	var DEPARTMENT      = 'department';
	var LINE			= 'item';
	var STATUS          = 'orderstatus';
	var AMOUNT          = 'amount';
	var MARGIN          = 'custcol_fle_mar';
	var TRANDATE        = 'trandate';
	var BILID           = 'custcol_fle_ven_bill';
	var INTERNALID      = 'internalid';
	var LINEKEY         = 'lineuniquekey';
	var REPORTCUST      = 'custbody3';
	var REPORTPRJ       = 'custbody2';
	var BILLPROCESSED   = 'custbody_fle_bill_processed';

    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function invoiceCreateMain(scriptContext) {
    	
    	var vendorbillSearchSumm = search.create({
    		   type: "vendorbill",
    		   filters:
    		   [
    		      ["type","anyof","VendBill"], 
    		      "AND", 
    		      ["mainline","is","F"], 
    		      "AND", 
    		      ["taxline","is","F"],
    		      "AND", 
    		      ["custbody_fle_bill_processed","is","F"],
    		      //"AND", 
    		      //["custcol_fle_cust_invoice","anyof","@NONE@"], 
    		      "AND", 
    		      ["custbody_fle_due_date","within","thismonth"] // lastmonth
    		   ],
    		   columns:
    		   [
    		      search.createColumn({name: "subsidiary",summary: "GROUP",label: "Subsidiary"}),
    		      search.createColumn({name: "custbody3",summary: "GROUP",label: "Reporting_Customer"}),
    		      search.createColumn({name: "class",summary: "GROUP",label: "Project"})
    		   ]
    		});
    	
    	var vendorBillSumm    = vendorbillSearchSumm.run().getRange({start: 0, end: 1000});
    	
    	for ( var i = 0; i < vendorBillSumm.length; i++) {
    		var subsidiary = vendorBillSumm[i].getValue({name: SUBSIDIARY, summary:'GROUP'});
    		var entity	   = vendorBillSumm[i].getValue({name: REPORTCUST, summary:'GROUP'});
    		var cls	       = vendorBillSumm[i].getValue({name: CLASS, summary:'GROUP'});
    		
    		log.debug("VendorBillSumm  - subsidiary-",subsidiary+', entity-'+entity+', cls-'+cls);
    		createInvoice(subsidiary, entity, cls);
    	}
    	updateProcessedBills();
    }
    
    /**
	 * Create Invoice.
	 * 
	 * @since 1.0.0 
	 * @private
	 * @param {String} subsidiary, entity, unit
	 * @returns {String} invRecID
	 */
	function createInvoice(subsidiary, entity, cls){
		
		var vendorbillSearchResult = search.create({
			   type: "vendorbill",
			   filters:
			   [
			      ["type","anyof","VendBill"], 
			      "AND", 
			      ["mainline","is","F"], 
			      "AND", 
			      ["taxline","is","F"], 
			      "AND", 
			      ["subsidiary","anyof",subsidiary], 
			      "AND", 
			      ["custbody3","anyof",entity], 
			      "AND", 
			      ["class","anyof",cls],
			      "AND", 
    		      ["custbody_fle_bill_processed","is","F"],
			      //"AND", 
			      //["custcol_fle_cust_invoice","anyof","@NONE@"], 
			      "AND", 
			      ["custbody_fle_due_date","within","thismonth"] // lastmonth
			   ],
			   columns:
			   [
			      search.createColumn({name: "subsidiary", label: "Subsidiary"}),
			      search.createColumn({name: "custbody3", label: "Reporting_Customer"}),
			      search.createColumn({name: "class", label: "Project"}),
			      search.createColumn({name: "internalid", label: "Internal ID"}),
			      search.createColumn({name: "lineuniquekey", label: "Line Unique Key"}),
			      search.createColumn({name: "item", label: "Item"}),
			      search.createColumn({name: "amount", label: "Amount"}),
			      search.createColumn({name: "custcol_fle_mar", label: "Margin"})
			   ]
			});
		
		var vendorbillLineResult    = vendorbillSearchResult.run().getRange({start: 0, end: 1000});
    	for ( var k = 0; k < vendorbillLineResult.length; k++) {
    		var sub    = vendorbillLineResult[k].getValue({name: SUBSIDIARY});
    		var name   = vendorbillLineResult[k].getValue({name: REPORTCUST});
    		var cls    = vendorbillLineResult[k].getValue({name: CLASS});
    		var bilId  = vendorbillLineResult[k].getValue({name: INTERNALID});
    		var lineId = vendorbillLineResult[k].getValue({name: LINEKEY});
    		var item   = vendorbillLineResult[k].getValue({name: LINE});
    		var amount = parseFloat(vendorbillLineResult[k].getValue({name: AMOUNT}));
    		var margin = vendorbillLineResult[k].getValue({name: MARGIN});
    		var amountToCharge = 0;
    		
    		if (!isNullOrEmpty(margin)){
    			margin = parseFloat(margin);
    			if (margin != 0){
    				amountToCharge = ((amount * margin) / 100).toFixed(2);
    			} else {
    				amountToCharge = amount;    	    		
    			}
    		}else{
    			amountToCharge = amount;        		
    		}
    		
    		log.debug("Inv List - k-",k+', sub-'+sub+', name-'+name+', cls-'+cls+', item-'+item+', amount-'+amount+', margin-'+margin+', amountToCharge-'+amountToCharge+', bilId-'+bilId+', lineId-'+lineId);
    		
    		if(k == 0){
    			var invRec = record.create({
    				type : record.Type.INVOICE,
    				isDynamic: true 
 	       		});
    			invRec.setValue(ENTITY, name);
    			invRec.setValue(TRANDATE, new Date());
    			invRec.setValue(SUBSIDIARY, subsidiary);
    			invRec.setValue(REPORTCUST, name);
    			invRec.setValue(REPORTPRJ, cls);
    			
    			invRec.selectNewLine({sublistId : LINE});
    			invRec.setCurrentSublistValue({
    					   sublistId : LINE,
    		               fieldId   : LINE,
    		               value     : item
    		            });
    			invRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : AMOUNT,
    	                value     :	amountToCharge
    	             });
    			invRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : BILID,
	                value     :	bilId
	             });
    			invRec.commitLine({sublistId : LINE});
    		}else if (k > 0){
    			invRec.selectNewLine({sublistId : LINE});
    			invRec.setCurrentSublistValue({
    					   sublistId : LINE,
    		               fieldId   : LINE,
    		               value     : item
    		            });
    			invRec.setCurrentSublistValue({
    	                sublistId : LINE,
    	                fieldId   : AMOUNT,
    	                value     :	amountToCharge
    	             });
    			invRec.setCurrentSublistValue({
	                sublistId : LINE,
	                fieldId   : BILID,
	                value     :	bilId
	             });
    			invRec.commitLine({sublistId : LINE});
    		}
    		if (k == vendorbillLineResult.length - 1){
    			var invRecID =  invRec.save();
    	        log.debug({    
    	            title: 'Invoice Created', 
    	            details: 'New invRecID:  ' + invRecID
    	        });
    		}
    	}
	}
	
	/**
	 * Update Bill.
	 * 
	 * @since 1.0.0 
	 * @private
	 * @param {String} 
	 * @returns {String} 
	 */
	function updateProcessedBills(){
		var vendorbillSearch = search.create({
 		   type: "vendorbill",
 		   filters:
 		   [
 		      ["type","anyof","VendBill"], 
 		      "AND", 
 		      ["mainline","is","T"],
 		      "AND", 
		      ["custbody_fle_bill_processed","is","F"],
 		      "AND", 
 		      ["custbody_fle_due_date","within","thismonth"] // lastmonth
 		   ],
 		   columns:
 		   [
 		      search.createColumn({name: "internalid",summary: "GROUP",label: "Internal ID"})
 		   ]
 		});
		
		var searchResultCount = vendorbillSearch.runPaged().count;
		//log.debug("vendorbillSearchObj result count",searchResultCount);
		vendorbillSearch.run().each(function(result){
			var internalid = result.getValue({name: 'internalid', summary:'GROUP'});
			//log.debug("vendorbillSearchObj result count",internalid);
			var id = record.submitFields({
    		    type: 'vendorbill',
    		    id: internalid,
    		    values: {
    		    	'custbody_fle_bill_processed': true
    		    }
    		});
		   return true;
		});
	}

    return {
        execute: invoiceCreateMain
    };
    
});
function isNullOrEmpty(strVal){return(strVal == undefined || strVal == null || strVal === "");}