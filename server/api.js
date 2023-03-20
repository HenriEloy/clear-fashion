const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const {MongoClient, ObjectId} = require('mongodb');
const MONGODB_URI = 'mongodb+srv://root:wcXPTRe4BQtX2AK@cluster0.e1lxg2t.mongodb.net/?retryWrites=true&writeConcern=majority';
const MONGODB_DB_NAME = 'cluster0';

const PORT = 8092;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

app.get('/products/search', async (request, response) => {
  try{
    const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME)
    const collection = db.collection('products');
	  
	  let brand = request.query.brand;
	  let price = request.query.price ;
	  let limit = request.query.limit;
	  
	  let query = {};
	  if(brand != undefined){
		  query.brand = brand;
	  }
	  if (price != undefined) {
		query.price = {$lte: parseInt(price)};
	  }
	  if (limit == undefined) {
		limit = 12;
	  }
	  result = await collection.find(query).limit(parseInt(limit)).toArray();
	  response.send({result : result});
  } catch(e){
	  response.send({error : "invalid search"});  
  }
  
});

app.get('/products/:id', async(request, response) => {
  try{
    const client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    const db =  client.db(MONGODB_DB_NAME)
    const collection = db.collection('products');
    const productId = request.params.id;
    const searchresult = await collection.findOne({_id: ObjectId(productId)});
    response.send({result : searchresult});
    client.close();
  } catch(e){
    response.send({error : "invalid id"});  
  }
});

app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);
