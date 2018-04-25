/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/log', 'N/file', 'N/email', 'N/format', './Lib_Utility.js'], function(NS_Record, NS_Search, NS_Log, file, NS_Email, NS_Format, UtilityLib) {
    function onRequest(params) {
        try {
            var arrFilters = [];
            arrFilters.push(NS_Search.createFilter({
                name : 'custbody_send_to_warehouse',
                operator : NS_Search.Operator.IS,
                values : ['T']
            }));

            var objSearch = NS_Search.create({
                type: NS_Search.Type.SALES_ORDER,
                filters: arrFilters,
                columns: ['custbody_send_to_warehouse', 'custbody_sent_to_warehouse', 'custbody_date_sent_to_warehouse']
            });
            
            var objects = {};
            objSearch.run().each(function(result) {
                if (!objects.hasOwnProperty(result.id)) {
                    objects[result.id] = (UtilityLib.isEmpty(result.getValue('custbody_sent_to_warehouse'))) ? 0 : result.getValue('custbody_sent_to_warehouse');
                }
                
                return true;
            });
           
            if (Object.size(objects) != 0)  {
                var xmlString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<Orders>\n';

                Object.keys(objects).forEach(function(key) {
                    xmlString += "<Order>\n";
                    var soRecord = NS_Record.load({
                        type: NS_Record.Type.SALES_ORDER,
                        id: key,
                        isDynamic: true
                    });

                    // General Information Elements
                    xmlString += generateXMLElement( "OrderId", soRecord.id);
                    xmlString += generateXMLElement( "OrderNumber", soRecord.getValue({fieldId: 'tranid'}) );
                    xmlString += generateXMLElement( "OrderDate", formatDate(soRecord.getValue({fieldId: 'trandate'})) );
                    xmlString += generateXMLElement( "OrderStatus", soRecord.getText({fieldId: 'orderstatus'}) );
                    xmlString += generateXMLElement( "CustomerName", soRecord.getText({fieldId: 'entity'}) );
                    xmlString += generateXMLElement( "CustomerId", soRecord.getValue({fieldId: 'entity'}) );

                    // Billing Relation Elements
                    var billAddrFields = NS_Search.lookupFields({
                        type: 'address',
                        id: soRecord.getText({fieldId: 'billingaddress'}),
                        columns: ['address1', 'address2', 'city', 'state', 'zip', 'country']
                    });
                    xmlString += generateXMLElement( "BillingAddress1", billAddrFields.address1 );
                    xmlString += generateXMLElement( "BillingAddress2", billAddrFields.address2 );
                    xmlString += generateXMLElement( "BillingCity", billAddrFields.city );
                    xmlString += generateXMLElement( "BillingState", billAddrFields.state );
                    xmlString += generateXMLElement( "BillingZipCode", billAddrFields.zip );
                    xmlString += generateXMLElement( "BillingCountry", billAddrFields.country[0].value );
                    
                    var customerFields = NS_Search.lookupFields({
                        type: 'customer', 
                        id: soRecord.getValue({fieldId: 'entity'}),
                        columns: ['email', 'phone']
                    });
                    xmlString += generateXMLElement( "BillingEmail", customerFields.email );
                    xmlString += generateXMLElement( "BillingPhone", customerFields.phone );

                    // Shipping Relation Elements
                    var shipAddrFields = NS_Search.lookupFields({
                        type: 'address',
                        id: soRecord.getText({fieldId: 'shippingaddress'}),
                        columns: ['addressee', 'address1', 'address2', 'city', 'state', 'zip', 'country']
                    });
                    xmlString += generateXMLElement( "ShippingAddressee", shipAddrFields.addressee );
                    xmlString += generateXMLElement( "ShippingAddress1", shipAddrFields.address1 );
                    xmlString += generateXMLElement( "ShippingAddress2", shipAddrFields.address2 );
                    xmlString += generateXMLElement( "ShippingCity", shipAddrFields.city );
                    xmlString += generateXMLElement( "ShippingState", shipAddrFields.state );
                    xmlString += generateXMLElement( "ShippingZipCode", shipAddrFields.zip );
                    xmlString += generateXMLElement( "ShippingCountry", shipAddrFields.country[0].value );
                    xmlString += generateXMLElement( "ShipMethodId", soRecord.getValue({fieldId: 'shipmethod'}) );
                    xmlString += generateXMLElement( "ShipMethod", soRecord.getText({fieldId: 'shipmethod'}) );
                    xmlString += generateXMLElement( "ShippingTaxCode", soRecord.getText({fieldId: 'shippingtaxcode'}) );
                    xmlString += generateXMLElement( "ShippingTaxRate", soRecord.getValue({fieldId: 'shippingtax1rate'}) );
                    xmlString += generateXMLElement( "ShippingDate", formatDate(soRecord.getValue({fieldId: 'shipdate'})) );
                    xmlString += generateXMLElement( "ShippingCarrier", soRecord.getValue({fieldId: 'shipcarrier'}) );
                    xmlString += generateXMLElement( "ShipVia", soRecord.getValue({fieldId: 'shipmethod'}) );
                    xmlString += generateXMLElement( "TrackingNumber", soRecord.getValue({fieldId: 'linkedtrackingnumbers'}) );

                    // Payment Relation Elements
                    xmlString += generateXMLElement( "PaymentMethodId", soRecord.getValue({fieldId: 'paymentmethod'}) );
                    xmlString += generateXMLElement( "PaymentMethod", soRecord.getText({fieldId: 'paymentmethod'}) );

                    // Amount Relation Elements
                    xmlString += generateXMLElement( "SubTotal", soRecord.getValue({fieldId: 'subtotal'}) );
                    xmlString += generateXMLElement( "DiscountTotal", soRecord.getValue({fieldId: 'discounttotal'}) );
                    xmlString += generateXMLElement( "TaxTotal", soRecord.getValue({fieldId: 'taxtotal'}) );
                    xmlString += generateXMLElement( "ShippingCost", soRecord.getValue({fieldId: 'altshippingcost'}) );
                    xmlString += generateXMLElement( "OrderTotal", soRecord.getValue({fieldId: 'total'}) );

                    // General Information Elements
                    xmlString += generateXMLElement( "Opportunity", soRecord.getValue({fieldId: 'opportunity'}) );
                    xmlString += generateXMLElement( "LeadSource", soRecord.getText({fieldId: 'leadsource'}) );
                    xmlString += generateXMLElement( "TaxID", soRecord.getValue({fieldId: 'vatregnum'}) );
                    xmlString += generateXMLElement( "Currency", soRecord.getText({fieldId: 'currency'}) );
                    xmlString += generateXMLElement( "Customer_PO_Number", soRecord.getValue({fieldId: 'custbody_cust_po_num'}) );
                    xmlString += generateXMLElement( "Location", soRecord.getValue({fieldId: 'location'}) );
                    xmlString += generateXMLElement( "SalesRep", soRecord.getValue({fieldId: 'salesrep'}) );
                    xmlString += generateXMLElement( "Memo", soRecord.getValue({fieldId: 'memo'}) );
                    xmlString += generateXMLElement( "Instructions", soRecord.getValue({fieldId: 'custbody_del_instructions'}) );
                    xmlString += generateXMLElement( "Contact", soRecord.getValue({fieldId: 'custbody_contact'}) );
                    xmlString += generateXMLElement( "ContactPhone", soRecord.getValue({fieldId: 'custbody_contact_phone'}) );
                    xmlString += generateXMLElement( "AccountNo", soRecord.getValue({fieldId: 'custbody_bk_num'}) );
                    xmlString += generateXMLElement( "DeliveryDate", formatDate(soRecord.getValue({fieldId: 'custbodydeliverydate'})) );
                    xmlString += generateXMLElement( "TransDate", formatDate(soRecord.getValue({fieldId: 'trandate'})) );
                    xmlString += generateXMLElement( "Status", soRecord.getValue({fieldId: 'status  '}) );

                    // Item Information Elements
                    xmlString += "<OrderLineItems>\n";
                    var itemCount = soRecord.getLineCount({sublistId: 'item'});
                    var itemSublist = soRecord.getSublist({sublistId: 'item'});
                    
                    for (var i = 0; i < itemCount; i++) {
                        xmlString += "<OrderLineItem>\n";

                        var lineNum = soRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        xmlString += generateXMLElement( "Id", soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'}));
                        xmlString += generateXMLElement( "Name", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'item'}));
                        xmlString += generateXMLElement( "Description", soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'description'}).replace(/&/gi, "and"));
                        xmlString += generateXMLElement( "Quantity", soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'}));
                        xmlString += generateXMLElement( "Price", soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'rate'}));
                        var amount = soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'amount'});
                        xmlString += generateXMLElement( "Total", amount);
                        var taxRate = soRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'taxrate1'});
                        xmlString += generateXMLElement( "TaxRate", taxRate);
                        xmlString += generateXMLElement( "TaxCode", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'taxcode'}));
                        xmlString += generateXMLElement( "TaxAmount", parseFloat(amount) * parseFloat(taxRate) / 100.0);
                        xmlString += generateXMLElement( "UnitPerCase", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'custcol_units_per_case'}));
                        xmlString += generateXMLElement( "ItemCode", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'custcol_item_code'}));
                        xmlString += generateXMLElement( "CustRef", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'custcolreference_cust'}));
                        xmlString += generateXMLElement( "CustRefOther", soRecord.getCurrentSublistText({sublistId: 'item', fieldId: 'custcol_ref_column'}));

                        xmlString += "</OrderLineItem>\n";
                    }
                    xmlString += "</OrderLineItems>\n";

                    xmlString += "</Order>\n";
                });
                
                xmlString += "</Orders>\n";
                
                // Create Temporary XML file
                var fileObj = file.create({
                    name: 'SalesOrder.xml',
                    fileType: file.Type.XMLDOC,
                    contents: xmlString
                });
                sendEmailWithAttachement(null, fileObj);

                Object.keys(objects).forEach(function(key) {
                    var soRecord = NS_Record.load({
                        type: NS_Record.Type.SALES_ORDER,
                        id: key,
                        isDynamic: true
                    });
                    
                    soRecord.setValue({
                        fieldId: 'custbody_send_to_warehouse',
                        value: false,
                        ignoreFieldChange: true
                    });

                    var sentWarehouse = parseInt(objects[key]) + 1;
                    NS_Log.debug('Value', objects[key] + " ---- " + sentWarehouse);
                    soRecord.setValue({
                        fieldId: 'custbody_sent_to_warehouse',
                        value: sentWarehouse,
                        ignoreFieldChange: true
                    });

                    var objNewDate = new Date();
                    var formattedDateString = NS_Format.format({
                        value : objNewDate,
                        type : NS_Format.Type.DATETIMETZ
                    });
                    soRecord.setValue({
                        fieldId: 'custbody_date_sent_to_warehouse',
                        value: objNewDate,
                        ignoreFieldChange: true
                    });

                    var recordId = soRecord.save();
                    NS_Log.debug('Updated Record ID : ', recordId);
                    return true;
                });

                // NS_Log.debug("XML String", xmlString);
            }
        } catch (error)
		{
			if (error.message != undefined)
			{
				NS_Log.error('Process Error', error.name + ' : ' + error.message);
			}
			else
			{
				NS_Log.error('Unexpected Error', error.toString());
			}
		}
    }

    function generateXMLElement(key, value) {
        if (UtilityLib.isEmpty(value)) {
            value = '';
        }
        return "<" + key + ">" + value + "</" + key + ">\n";
    }

    function sendEmailWithAttachement(emails, fileObj) {
        var senderId = 24966;
        emails= [
            'mtatum@tatumconsulting.com', 
            'ediadmin@heropetbrands.com',
            'marcustatum@att.net'
        ];
        NS_Email.sendBulk({
            author: senderId,
            recipients: emails,
            subject: 'Bramton UK - Warehouse Sales Order',
            body: 'Check the attached file',
            attachments: [fileObj]
        });
    }

    function formatDate(date) {
        var dateObj = new Date(date);
        return dateObj.yyyymmdd();
    }

    Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    
    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
            ].join('');
    };
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    return {
      onRequest: onRequest
    };
});