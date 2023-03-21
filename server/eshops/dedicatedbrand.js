const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Parse webpage e-shop
 * @param  {String} data - html response
 * @return {Array} products
 */
const parse_dedi = async(rep) => {

  const { products } = await rep.json();
  const filtered = products.filter(data => Object.keys(data).length > 0);

  return filtered.map(data => ({
		name: data.name,
		brand: "Dedicated",
		price: data.price.priceAsNumber,
		image: data.image[0],
		link: "https://www.dedicatedbrand.com/en/" + data['canonicalUri'],
		date : Date.now()
	  }));
};

const use_montlimart = async (response) => {
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const allLinks = $('.sub .a-niveau1').map((_, elt) => $(elt).attr('href')).get();
  const filteredLinks = allLinks.filter(link => !link.includes("propos"));
  
  let products = [];
  for (const link of filteredLinks) {
    console.log(link);
    const response = await fetch(link);
    const html = await response.text();
    const $ = cheerio.load(html);
    const parsedProducts = await parse_montlimart($);
    products = products.concat(parsedProducts);
  }
  
  return products;
};

const parse_montlimart = async ($) => {
  const products = await Promise.all($('.products-list__block').map(async (_, elt) => {
    const product = {};
    product.name = $(elt).find('.text-reset').text().trim().replace(/\s+/g, " ");
    product.brand = "Montlimart";
    product.price = parseFloat($(elt).find('.price').text().replace(",", "."));
    product.link = $(elt).find('.product-miniature__thumb-link').attr("href");
    if ($(elt).find('video').length > 0) {
      const response = await fetch(product.link);
      const html = await response.text();
      const $ = cheerio.load(html);
      product.image = $('img')[0].attribs["data-src"];
    } else {
      product.image = $(elt).find('.product-miniature__thumb img')[0].attribs["data-src"];
    }
    product.date = Date.now();
    return product;
  }));
  let filteredProducts = products.filter(product => ![...product.name].includes("CADEAU"));
  //console.log(filteredProducts);
  //filteredProducts = filteredProducts.filter(product => !product.name != null);
  return filteredProducts;
  
};

const parse_circle = data => {
  const $ = cheerio.load(data);
  const products = [];
  $("li.grid__item").each((i, element) => {
    const product = {};
    product.name = $(element).find(".card__heading.h5").text().trim().replace(/\s+/g, " ");
    product.price = parseInt($(element).find(".price__sale .money").text().slice(1), 10);
    product.link = "https://shop.circlesportswear.com" + $(element).find("h3.h5 .full-unstyled-link").attr("href");
    product.image = "https:" + $(element).find("img").attr("src");
    product.brand = "Circle";
    product.date = Date.now();
    products.push(product);
  });
  return products;
};



/**
 * Scrape all the products for a given url page
 * @param  {[type]}  url
 * @return {Array|null}
 */
module.exports.scrape = async url => {
  try {

    const rep = await fetch(url);

    let result="No Result";

    if(url.includes("dedicated")){
      result = parse_dedi(rep);
    }
    else if(url.includes("montlimart")){
      result = use_montlimart(rep);
    }
    else if(url.includes("circle")){
      const body = await rep.text();
      result = parse_circle(body);}

    return result;

  } catch (error) {
    console.error(error);
    return null;
  }
};