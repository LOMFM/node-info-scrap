#!/usr/bin/env node

var fs = require('fs')
var request = require('request')
var cheerio = require('cheerio')
var uuid = require('uuid/v1')

var config = require('./env')

var links = fs.readFileSync('links.txt', 'utf-8').split('\r\n')

var infoScrap = function(index){
    if( index < links.length ){
		let url = links[index]
		let options = { ...config.REQUESTOPTION }
		options.url = url

		request( options, function(error, response, html) {
			if( !error ){
                var $ = cheerio.load(html);
                let output = {}
                output = {...config.OUTPUTPATTERN}

                output.source_url = url


                var contract_number = $("#mainContent table:first-of-type table tr:first-child td:nth-of-type(2)")
                contract_number = contract_number == null ? "" : contract_number.text()
                var title = $("#mainContent table:first-of-type table tr:nth-of-type(2) td:nth-of-type(2)")
                title = title == null ? "" : title.text()
                var supplier_name = $("#mainContent table:first-of-type table tr:nth-of-type(3) td:nth-of-type(4)")
                supplier_name = supplier_name == null ? "" : supplier_name.text()
                supplier_name = supplier_name.trim()
                var eff_exp = $("#mainContent table:first-of-type table tr:nth-of-type(6) td:nth-of-type(2)")
                eff_exp = eff_exp == null ? "" : eff_exp.text()
                var contract_file = "https://wwwcfprd.doa.louisiana.gov/OSP/Lapac/Agency/PDF/LAGOVContracts/K" + contract_number
                var price_file = "https://wwwcfprd.doa.louisiana.gov/osp/lapac/ecat/dsp_createXLSXCatalogItems.cfm?contract=" + contract_number
                var effective = ""
                var expire = ""
                if( eff_exp ){
                    effective = eff_exp.split("-")[0]
                    effective = effective == null ? "" : effective.trim()

                    expire = eff_exp.split("-")[1]
                    expire = expire == null ? "" : expire.trim()
                }

                var coop = $("#mainContent table:first-of-type table tr:nth-of-type(6) td:nth-of-type(4)")
                coop = coop == null ? "" : coop.text()
                coop = coop == null ? "" : coop.trim()
                if( coop == "No"){
                    coop = false
                }
                else {
                    coop = true
                }
                
                var buyers = []
                if ($("#mainContent table:nth-of-type(3) table")){
                    $("#mainContent table:nth-of-type(3) table").each(function(){
                        let buyer_node = $(this)
                        let buyer = {}
                        buyer.organization = buyer_node.find("tr:first-child td:nth-of-type(4)")
                        buyer.organization = buyer.organization == null ? "" : buyer.organization.text()
                        buyer.name = buyer_node.find("tr:nth-of-type(2) td:nth-of-type(2)")
                        buyer.name = buyer.name == null ? "" : buyer.name.text()
                        buyer.phone = buyer_node.find("tr:nth-of-type(3) td:nth-of-type(2)")
                        buyer.phone = buyer.phone == null ? "" : buyer.phone.text()
                        buyer.mail = buyer_node.find("tr:nth-of-type(2) td:nth-of-type(4)")
                        buyer.mail = buyer.mail == null ? "" : buyer.mail.text()
                        buyers.push(buyer)
                    })
                }
                

                var supplier_texts = $("#mainContent table:nth-of-type(4) table tr:nth-of-type(2) td:last-child")
                supplier_texts = supplier_texts == null ? "" : supplier_texts.html()
                supplier_texts = supplier_texts == null ? [] : supplier_texts.split("<br>")
                var supplier_addr
                var supplier_city
                var supplier_state
                var supplier_zip
                var suppliers = []

                if( supplier_texts.length > 2 ){
                    supplier_addr = supplier_texts[0] == null ? "" : supplier_texts[0].trim()
                    let city_state_zip_text = supplier_texts[1] == null ? "" : supplier_texts[1].trim()
                    let city_state_zip_array = city_state_zip_text == null ? [] :  city_state_zip_text.split(",")
                    let state_zip_text = city_state_zip_array[1] == null ? "" : city_state_zip_array[1].trim()
                    let state_zip_array = state_zip_text.split(" ")

                    supplier_city = city_state_zip_array[0] == null ? "" : city_state_zip_array[0].trim()
                    supplier_state = state_zip_array[0] == null ? "" : state_zip_array[0].trim()
                    supplier_zip = state_zip_array.pop()

                    for( let i = 3 ; i < supplier_texts.length - 1; i+=4){
                        let supplier = {}
                        supplier.name = supplier_texts[i]
                        supplier.name = supplier.name == null ? [] : supplier.name.trim().split("Contact:")
                        supplier.name = supplier.name.length > 0 ? supplier.name[1].trim() : ""
                        supplier.email = supplier_texts[i+1]
                        supplier.email = supplier.email == null ? [] : supplier.email.trim().split("Email:")
                        supplier.email = supplier.email.length > 0 ? supplier.email[1].trim() : ""
                        supplier.phone = supplier_texts[i+2]
                        supplier.phone = supplier.phone == null ? [] : supplier.phone.trim().split("Phone:")
                        supplier.phone = supplier.phone.length > 0 ? supplier.phone[1].trim() : ""
                        supplier.addr = supplier_addr
                        supplier.city = supplier_city
                        supplier.state = supplier_state
                        supplier.zip = supplier_zip
                        suppliers.push(supplier)
                    }
                }

                var input_actions = [];
                $("#mainContent table:nth-of-type(6) input").each(function(){
                    input_actions.push($(this).val())
                })

                output.id = uuid()
                output.fields.buyer_contacts = buyers
                output.fields.contract_files = [
                    {
                        name: "Contract",
                        url : contract_file
                    }
                ]
                output.fields.contract_number = contract_number
                output.fields.effective = effective
                output.fields.expiration = expire
                output.fields.supplier_contacts = suppliers
                output.fields.suppliers = supplier_name
                output.fields.title = title
                output.fields.cooperative_language = coop

                output.fields.pricing_files = []
                if( input_actions.indexOf("Export Catalog Items to Excel")){
                    output.fields.pricing_files.push({
                        name: "Catalog",
                        url: price_file
                    })
                }

                if( input_actions.indexOf("Show Additional Attachments") > -1){
                    let attach_url = "https://wwwcfprd.doa.louisiana.gov/osp/lapac/ecat/dsp_AdditionalAttachments.cfm?contract=" + contract_number
                    let attach_option = {...config.REQUESTOPTION}
                    attach_option.url = attach_url

                    request(attach_option, function( error, response, html) {
                        if( !error ){
                            var $ = cheerio.load(html)
                            
                            $("a").each(function(){
                                var doc = {}
                                doc.name = $(this).text()
                                doc.url = $(this).attr().href

                                if( doc.name.toLowerCase().indexOf("price") > -1){
                                    output.fields.pricing_files.push(doc)
                                }
                                else {
                                    output.fields.other_docs_files.push(doc)
                                }
                            })

                            // Generate the file
                            generateFile(JSON.stringify(output), contract_number)
                        }
                        else {
                            // Generate the file
                            generateFile(JSON.stringify(output), contract_number)
                        }
                    })
                }
                else{
                    // Generate the File
                    generateFile(JSON.stringify(output), contract_number)
                }
			}
			else{
				console.log("failed in scrapping of this page : " + url + "with this error", error)
			}
			infoScrap(index+1)
		})
	}
	else{
		// Printing the all result 
		console.log( "Scrapped all page. Printing to file")
	}
}

infoScrap(0)



var generateFile = function(content, filename){
    fs.writeFile("./result/" + filename + ".json", content, function(err){
        if( err ){
            console.log("Failed in writing the file for the contract " + filename)
        }
        else {
            console.log("Generated the file for the contract " + filename)
        }
    })
}