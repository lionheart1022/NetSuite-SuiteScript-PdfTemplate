/**
 *@NApiVersion 2.x
SW MR SO Auto Close
 *@NScriptType MapReduceScript
 */

define(['N/search', 'N/record'], function(search, record) {
          
	function getInputData(inputContext) {  
		return search.load({id: 1449});
	}
    
    
    function map(mapContext) {
    	var soResult = JSON.parse(mapContext.value);
    	var line = soResult.values.line;
    	mapContext.write({
    		key: mapContext.key,
    		value: line
    	});
    }
                        
    
    function reduce(reduceContext) {
    	log.debug('reduce', 'reduce');
    	log.debug(reduceContext.key, reduceContext.values);
    	
    	var soId = reduceContext.key;
    	
    	var soRec = record.load({
    		type: record.Type.SALES_ORDER,
    		id: soId
    	});
    	
    	log.debug('soRec', soRec);
    	
    	reduceContext.values.forEach(function(e){
    		try {
    			var lineNumber = parseInt(e) - 1;
    			log.debug('e', e);
        		soRec.setSublistValue({
        			sublistId: 'item',
        			fieldId: 'isclosed',
        			line: lineNumber,
        			value: true
        		});
    		} catch(er) {
    			log.debug(er.name, er.message);
    		}
    		
    		
    	});
    	
    	soRec.save();
    }
    

    function summarize(summarizeContext) {
               

    }
     
	    
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});