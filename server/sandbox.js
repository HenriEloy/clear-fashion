/* eslint-disable no-console, no-process-exit */
const scraping_code= require('./eshops/dedicatedbrand');

const {MongoClient} = require('mongodb');
const MONGODB_URI = 'mongodb+srv://root:wcXPTRe4BQtX2AK@cluster0.e1lxg2t.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'cluster0';

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
    }});

  await connectToMongo(finalProd);
  //await query_Brand();
  //await query_Less50();
  //await query_SortByPrice();
  //await query_SortByDate();
  //await query_recentProd();
}



async function connectToMongo(finalProd) {

  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)

  const collection = db.collection('products');
  collection.drop();
  const result = await collection.insertMany(finalProd);

  client.close();
}

async function query_Brand(){
  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)
  const collection = db.collection('products');

  const productsMontli = await collection.find({brand:"Montlimart"}).toArray();;
  console.log("Montlimart products :" + JSON.stringify(productsMontli));
  client.close();
  return productsMontli;
}

async function query_Less50(){
  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)
  const collection = db.collection('products');

  const productsLess50 = await collection.find({price: {$lt: 50}}).toArray();
  console.log("Products less than 50euros :" + JSON.stringify(productsLess50));
  client.close();
  return productsLess50;
}

async function query_SortByPrice(){
  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)
  const collection = db.collection('products');

  const productsSortedPrice = await collection.find().sort({price: 1}).toArray();
  console.log("Products by price :" + JSON.stringify(productsSortedPrice));
  client.close();
  return productsSortedPrice;
}

async function query_SortByDate(){
  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)
  const collection = db.collection('products');

  const productsSortedDate = await collection.find().sort({date: -1}).toArray();
  console.log("Products by date :" + JSON.stringify(productsSortedDate));
  client.close();
  return productsSortedDate;
}

async function query_recentProd(){
  const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
  const db =  client.db(MONGODB_DB_NAME)
  const collection = db.collection('products');

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  console.log(twoWeeksAgo);
  const productsRecent = await collection.find({date: {$gt: twoWeeksAgo}}).toArray();
  console.log("Products recent :" + JSON.stringify(productsRecent));
  client.close();
  return productsRecent;
}


init();