/* eslint-disable no-console, no-process-exit */
const scraping_code= require('./eshops/dedicatedbrand');

async function sandbox (eshop) {
  try {

    const products = await scraping_code.scrape(eshop);
    console.log(`🕵️‍♀️  Elements for ${eshop} eshop`);
    return products;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

const [,, eshop] = process.argv;


async function init(){
  /* We have 3 sites to scrap*/
  const sites = ['https://www.dedicatedbrand.com/en/loadfilter', 'https://www.montlimart.com/', "https://shop.circlesportswear.com/collections/all"]
  let finalProd = [];

  for(i = 0; i<sites.length; i++){
    finalProd = finalProd.concat(await sandbox(sites[i]));
  }
  
  console.log(finalProd.length + " elements scrapped");
  const finalJson = JSON.stringify(finalProd);

  const fs = require('fs');
  fs.writeFile("result.json", finalJson, function(err) {
    if (err) {
        console.log(err);
    }
});
}


init();