const config = {
    REQUESTOPTION: {
		"rejectUnauthorized": false,
		"method": "GET",	
		"headers":{
				"X-API-VERSION": 1,
	        	"Content-Type" : "application/x-www-form-urlencoded"
	    }
    },
    INPUTFILE: "links.txt",
    OUTPUTFILE: "info.txt",
    OUTPUTPATTERN: {
        "type":"add",
        "id":"",
        "source_url": "",
        "source_key": "state-of-louisiana",
        "fields": {
          "amendments_files": [],
          "buyer_contacts": [
            
          ],
          "buyer_lead_agency": "State of Louisiana",
          "buyer_lead_agency_state": "LA",
          "buyer_lead_agency_type": "State agency",
          "contract_files": [
            
          ],
          "cooperative_language": "",
          "contract_number": "",
          "effective": "",
          "expiration": "",
          "other_docs_files": [
            
          ],
          "pricing_files": [
            
          ],
          "supplier_contacts": [
            
          ],
          "suppliers": "",
          "title": ""
        }
      }
}

module.exports = config